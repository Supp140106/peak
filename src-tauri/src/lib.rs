// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_file_dialog(content: String, default_filename: String) -> Result<bool, String> {
    let file_path = rfd::FileDialog::new()
        .set_file_name(&default_filename)
        .add_filter("JSON", &["json"])
        .save_file();

    if let Some(path) = file_path {
        fs::write(path, content)
            .map_err(|e| e.to_string())?;
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
        let content = fs::read_to_string(path)
            .map_err(|e| e.to_string())?;
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
            select_and_read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
