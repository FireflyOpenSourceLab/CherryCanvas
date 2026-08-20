use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                // 第一个子菜单 = 应用名菜单（系统自带项）
                let app_menu = SubmenuBuilder::new(app, "CherryCanvas")
                    .about(None)
                    .separator()
                    .services()
                    .separator()
                    .hide()
                    .hide_others()
                    .show_all()
                    .separator()
                    .quit()
                    .build()?;

                // 文件
                let file_menu = SubmenuBuilder::new(app, "文件")
                    .item(&MenuItemBuilder::new("新建白板").id("new_board").accelerator("CmdOrCtrl+N").build(app)?)
                    .item(&MenuItemBuilder::new("打开...").id("open").accelerator("CmdOrCtrl+O").build(app)?)
                    .item(&MenuItemBuilder::new("保存").id("save").accelerator("CmdOrCtrl+S").build(app)?)
                    .item(&MenuItemBuilder::new("另存为...").id("save_as").accelerator("CmdOrCtrl+Shift+S").build(app)?)
                    .separator()
                    .item(&MenuItemBuilder::new("关闭标签").id("close_tab").accelerator("CmdOrCtrl+W").build(app)?)
                    .build()?;

                // 编辑
                let edit_menu = SubmenuBuilder::new(app, "编辑")
                    .undo()
                    .redo()
                    .separator()
                    .cut()
                    .copy()
                    .paste()
                    .select_all()
                    .build()?;

                // 墨迹
                let ink_menu = SubmenuBuilder::new(app, "墨迹")
                    .item(&MenuItemBuilder::new("画笔").id("pen").accelerator("P").build(app)?)
                    .item(&MenuItemBuilder::new("橡皮擦").id("eraser").accelerator("E").build(app)?)
                    .item(&MenuItemBuilder::new("文本").id("text").accelerator("T").build(app)?)
                    .build()?;

                // 帮助
                let help_menu = SubmenuBuilder::new(app, "帮助")
                    .item(&MenuItemBuilder::new("关于 CherryCanvas").id("about").build(app)?)
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .items(&[&app_menu, &file_menu, &edit_menu, &ink_menu, &help_menu])
                    .build()?;

                app.set_menu(menu)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
