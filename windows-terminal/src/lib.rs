use std::cell::RefCell;

use deno_core::{Op, ZeroCopyBuf};
use deno_core::plugin_api::Interface;
use winapi::shared::minwindef::DWORD;
use winapi::um::wincon::{CONSOLE_SCREEN_BUFFER_INFO, CONSOLE_TEXTMODE_BUFFER, COORD, CreateConsoleScreenBuffer, GetConsoleScreenBufferInfo, SetConsoleActiveScreenBuffer, WriteConsoleOutputCharacterW};
use winapi::um::winnt::{GENERIC_READ, HANDLE};

use winapi_empty::Empty;

mod winapi_empty;

static mut INSTANCE_HANDLE: RefCell<HANDLE> = RefCell::new(winapi::_core::ptr::null_mut());

#[no_mangle]
pub fn deno_plugin_init(interface: &mut dyn Interface) {
    interface.register_op("create_console_screen_buffer", create_console_screen_buffer);
    interface.register_op("write_console_output_character", write_console_output_character);
    interface.register_op("get_console_screen_info", get_console_screen_info);
}

/**
 * @see https://docs.microsoft.com/en-us/windows/console/createconsolescreenbuffer
 */
fn create_console_screen_buffer(
    _interface: &mut dyn Interface,
    _data: &[u8],
    _zero_copy: &mut [ZeroCopyBuf],
) -> Op {
    unsafe {
        let handle = CreateConsoleScreenBuffer(GENERIC_READ, 0, std::ptr::null(), CONSOLE_TEXTMODE_BUFFER, std::ptr::null_mut());
        INSTANCE_HANDLE.replace(handle);
        SetConsoleActiveScreenBuffer(INSTANCE_HANDLE.borrow().as_mut().unwrap());
        Op::Sync(Box::from([]))
    }
}

/**
 * @see https://docs.microsoft.com/en-us/windows/console/getconsolescreenbufferinfo
 */
fn get_console_screen_info(_interface: &mut dyn Interface,
                           _data: &[u8],
                           _zero_copy: &mut [ZeroCopyBuf], ) -> Op {
    let console_info = unsafe {
        let handle = INSTANCE_HANDLE.borrow().as_mut().unwrap();
        let mut console_info = CONSOLE_SCREEN_BUFFER_INFO::empty();
        GetConsoleScreenBufferInfo(handle, &mut console_info);
        console_info
    };
    Op::Sync(Box::from([console_info.dwSize.X as u8, console_info.dwSize.Y as u8]))
}

/**
 * @see https://docs.microsoft.com/en-us/windows/console/writeconsoleoutputcharacter
 */
fn write_console_output_character(
    _interface: &mut dyn Interface,
    data: &[u8],
    _zero_copy: &mut [ZeroCopyBuf],
) -> Op {
    let utf8 = std::str::from_utf8(data).unwrap();
    let utf16: Vec<u16> = utf8.encode_utf16().collect();

    unsafe {
        let handle = INSTANCE_HANDLE.borrow().as_mut().unwrap();
        let mut written: u32 = 0;
        WriteConsoleOutputCharacterW(handle, utf16.as_ptr(), utf16.len() as DWORD, COORD { X: 0, Y: 0 }, &mut written);
    }
    Op::Sync(Box::from(data))
}
