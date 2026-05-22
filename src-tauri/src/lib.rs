// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::net::ToSocketAddrs;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ── Domain Blocking ──────────────────────────────────────────────────────────

const RULE_NAME: &str = "PeakFocusBlock";
const STATE_FILENAME: &str = "peak_block_state.json";

#[derive(Serialize, Deserialize, Default)]
struct BlockState {
    active: bool,
    domains: Vec<String>,
}

fn state_path() -> std::path::PathBuf {
    // %APPDATA%\com.dassu.peak\peak_block_state.json
    let base = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
    std::path::Path::new(&base).join("com.dassu.peak").join(STATE_FILENAME)
}

fn save_state(state: &BlockState) {
    if let Some(parent) = state_path().parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string(state) {
        let _ = fs::write(state_path(), json);
    }
}

fn load_state() -> BlockState {
    fs::read_to_string(state_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

/// Strip protocol and path, return bare hostname.
fn clean_hostname(domain: &str) -> String {
    let s = domain.trim();
    let s = if let Some(rest) = s.strip_prefix("https://") { rest }
            else if let Some(rest) = s.strip_prefix("http://") { rest }
            else { s };
    s.split('/').next().unwrap_or(s)
     .split('?').next().unwrap_or(s)
     .to_lowercase()
}

/// Resolve a hostname to all IPv4/IPv6 addresses.
fn resolve(hostname: &str) -> Vec<String> {
    let addr = format!("{}:80", hostname);
    match addr.to_socket_addrs() {
        Ok(iter) => iter.map(|a| a.ip().to_string()).collect(),
        Err(_) => vec![],
    }
}

/// Check if the current process has admin privileges (Windows).
fn is_admin() -> bool {
    Command::new("net")
        .args(["session"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn run_netsh(args: &[&str]) -> Result<(), String> {
    let out = Command::new("netsh")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

fn apply_firewall_rules(domains: &[String]) -> Result<(), String> {
    let ips: Vec<String> = domains
        .iter()
        .flat_map(|d| resolve(&clean_hostname(d)))
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    if ips.is_empty() {
        return Err("Could not resolve any IP addresses for the given domains.".into());
    }

    remove_firewall_rules();

    for (i, chunk) in ips.chunks(100).enumerate() {
        let rule_name = if i == 0 { RULE_NAME.to_string() } else { format!("{}{}", RULE_NAME, i) };
        let remote_ips = chunk.join(",");
        run_netsh(&[
            "advfirewall", "firewall", "add", "rule",
            &format!("name={}", rule_name),
            "dir=out", "action=block",
            &format!("remoteip={}", remote_ips),
        ])?;
    }
    Ok(())
}

fn remove_firewall_rules() {
    let _ = run_netsh(&["advfirewall", "firewall", "delete", "rule", &format!("name={}", RULE_NAME)]);
    for i in 1..=20 {
        let _ = run_netsh(&["advfirewall", "firewall", "delete", "rule", &format!("name={}{}", RULE_NAME, i)]);
    }
}

/// Register a Task Scheduler task that re-applies firewall rules at every logon.
/// The task runs a PowerShell script that reads the saved state and calls netsh.
fn register_startup_task(domains: &[String]) -> Result<(), String> {
    // Build a PowerShell one-liner that re-adds the firewall rule from the saved domain list
    // We embed the domain list directly so the task is self-contained
    let domains_json = serde_json::to_string(domains).unwrap_or_default();
    let ps_script = format!(
        r#"
$domains = '{domains}' | ConvertFrom-Json
$ips = @()
foreach ($d in $domains) {{
    try {{ $ips += [System.Net.Dns]::GetHostAddresses($d) | ForEach-Object {{ $_.IPAddressToString }} }} catch {{}}
}}
if ($ips.Count -gt 0) {{
    netsh advfirewall firewall delete rule name=PeakFocusBlock | Out-Null
    $chunks = [System.Linq.Enumerable]::Chunk($ips, 100)
    $i = 0
    foreach ($chunk in $chunks) {{
        $name = if ($i -eq 0) {{ 'PeakFocusBlock' }} else {{ "PeakFocusBlock$i" }}
        netsh advfirewall firewall add rule name=$name dir=out action=block remoteip=($chunk -join ',') | Out-Null
        $i++
    }}
}}
"#,
        domains = domains_json.replace('\'', "''")
    );

    // Write the script to AppData
    let script_dir = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
    let script_path = std::path::Path::new(&script_dir)
        .join("com.dassu.peak")
        .join("restore_block.ps1");
    let _ = fs::create_dir_all(script_path.parent().unwrap());
    fs::write(&script_path, ps_script).map_err(|e| e.to_string())?;

    let script_path_str = script_path.to_string_lossy().to_string();

    // Register via schtasks (no XML needed)
    let action = format!(
        "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \"{}\"",
        script_path_str
    );
    let out = Command::new("schtasks")
        .args([
            "/Create", "/F",
            "/TN", "PeakFocusBlockRestore",
            "/TR", &action,
            "/SC", "ONLOGON",
            "/RL", "HIGHEST",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

fn remove_startup_task() {
    let _ = Command::new("schtasks")
        .args(["/Delete", "/F", "/TN", "PeakFocusBlockRestore"])
        .output();
}

#[tauri::command]
async fn block_domains(domains: Vec<String>) -> Result<(), String> {
    if !is_admin() {
        return Err("Administrator privileges required to modify firewall rules.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        apply_firewall_rules(&domains)?;
        register_startup_task(&domains)?;
        save_state(&BlockState { active: true, domains });
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn unblock_domains() -> Result<(), String> {
    if !is_admin() {
        return Err("Administrator privileges required to modify firewall rules.".into());
    }
    tauri::async_runtime::spawn_blocking(|| {
        remove_firewall_rules();
        remove_startup_task();
        save_state(&BlockState::default());
        Ok(())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn check_admin() -> bool {
    is_admin()
}

#[tauri::command]
fn get_block_state() -> BlockState {
    load_state()
}

#[tauri::command]
fn save_file_dialog(content: String, default_filename: String) -> Result<bool, String> {
    let file_path = rfd::FileDialog::new()
        .set_file_name(&default_filename)
        .add_filter("JSON", &["json"])
        .save_file();

    if let Some(path) = file_path {
        fs::write(path, content).map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn select_and_read_file() -> Result<Option<String>, String> {
    let file_path = rfd::FileDialog::new()
        .add_filter("JSON", &["json"])
        .pick_file();

    if let Some(path) = file_path {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_file_dialog,
            select_and_read_file,
            block_domains,
            unblock_domains,
            check_admin,
            get_block_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
