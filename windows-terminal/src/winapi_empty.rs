use winapi::um::wincon::{CONSOLE_SCREEN_BUFFER_INFO, COORD, SMALL_RECT};

impl Empty for CONSOLE_SCREEN_BUFFER_INFO {
    fn empty() -> CONSOLE_SCREEN_BUFFER_INFO {
        CONSOLE_SCREEN_BUFFER_INFO {
            dwCursorPosition: COORD::empty(),
            dwMaximumWindowSize: COORD::empty(),
            dwSize: COORD::empty(),
            srWindow: SMALL_RECT::empty(),
            wAttributes: 0,
        }
    }
}

impl Empty for COORD {
    fn empty() -> COORD {
        COORD { X: 0, Y: 0 }
    }
}


impl Empty for SMALL_RECT {
    fn empty() -> SMALL_RECT {
        SMALL_RECT {
            Top: 0,
            Right: 0,
            Bottom: 0,
            Left: 0,
        }
    }
}

pub trait Empty {
    fn empty() -> Self;
}
