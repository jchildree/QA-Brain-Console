#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{WebviewUrl, WebviewWindowBuilder};

const APP_URL: &str = "http://localhost:8080";

fn find_compose_file() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("QA_BRAIN_COMPOSE_PATH") {
        return Some(PathBuf::from(p));
    }
    let mut dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    for _ in 0..8 {
        let candidate = dir.join("docker-compose.yml");
        if candidate.exists() {
            return Some(candidate);
        }
        dir = dir.parent()?.to_path_buf();
    }
    None
}

fn start_stack(compose_path: &Path) {
    let _ = Command::new("docker")
        .args(["compose", "-f"])
        .arg(compose_path)
        .args(["up", "-d", "--build"])
        .output();
}

fn loading_page() -> PathBuf {
    let html = format!(
        r#"<!doctype html><html><head><meta charset="utf-8"><style>
        body {{ font: 14px -apple-system,Segoe UI,sans-serif; background:#111; color:#eee;
                display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }}
        </style></head><body>Starting QA Brain&hellip;<script>
        (function poll() {{
          fetch("{APP_URL}", {{ mode: "no-cors" }})
            .then(() => location.replace("{APP_URL}"))
            .catch(() => setTimeout(poll, 500));
        }})();
        </script></body></html>"#
    );
    let path = std::env::temp_dir().join("qa-brain-loading.html");
    std::fs::write(&path, html).expect("write loading page");
    path
}

fn main() {
    if let Some(compose_path) = find_compose_file() {
        std::thread::spawn(move || start_stack(&compose_path));
    } else {
        eprintln!("docker-compose.yml not found; set QA_BRAIN_COMPOSE_PATH");
    }

    let loading = loading_page();
    let loading_url = format!("file:///{}", loading.to_string_lossy().replace('\\', "/"));

    tauri::Builder::default()
        .setup(move |app| {
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(loading_url.parse().expect("valid loading url")),
            )
            .title("QA Brain")
            .inner_size(1400.0, 900.0)
            .min_inner_size(900.0, 600.0)
            .center()
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running QA Brain desktop shell");
}
