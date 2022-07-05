use deno_bindgen::deno_bindgen;
use win32console::console::WinConsole;
use win32console::input::Coord;

#[deno_bindgen]
pub struct Size {
    width: u8,
    height: u8,
}

/**
 * @see https://docs.microsoft.com/en-us/windows/console/getconsolescreenbufferinfo
 */
#[deno_bindgen]
fn get_console_screen_info() -> Size {
    let console_info = WinConsole::current_output()
        .get_screen_buffer_info()
        .unwrap();
    return Size {
        width: console_info.screen_buffer_size.x as u8,
        height: console_info.screen_buffer_size.y as u8,
    };
}

/**
 * @see https://docs.microsoft.com/en-us/windows/console/writeconsoleoutputcharacter
 */
#[deno_bindgen]
fn write_console_output_character(data: &str) {
    let utf16: &[u16] = &data.encode_utf16().collect::<Vec<u16>>();
    WinConsole::current_output().set_cursor_position(Coord::new(0, 0)).unwrap();
    WinConsole::current_output().write_utf16(utf16).unwrap();
}
