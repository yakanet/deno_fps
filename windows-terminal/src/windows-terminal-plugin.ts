import {prepare} from 'https://deno.land/x/plugin_prepare/mod.ts';
const encoder = new TextEncoder();
const decoder = new TextDecoder();


// @ts-ignore
const core = Deno.core as {
    ops: () => { [key: string]: number };
    setAsyncHandler(rid: number, handler: (response: Uint8Array) => void): void;
    dispatch(
        rid: number,
        msg: any,
        buf?: ArrayBufferView
    ): Uint8Array | undefined;
};

export class WindowsTerminal {

    private constructor(private pluginId: number) {
    }

    static async new() {
        return new WindowsTerminal(await prepare({
            name: 'windows_terminal',
            checkCache: false,
            urls: {
                windows: 'file://./windows-terminal/target/debug/deno_plugin.dll',
            },
        }));
    }

    get_console_screen_info(): number[] {
        const result = core.dispatch(core.ops()['get_console_screen_info'], []);
        if (!result) {
            return [0, 0];
        }
        return [result[0], result[1]];
    }

    create_console_screen_buffer(): string {
        return decoder.decode(core.dispatch(core.ops()['create_console_screen_buffer'], []));
    }

    write_console_output_character(buffer: string) {
        return core.dispatch(core.ops()['write_console_output_character'], encoder.encode(buffer));
    }
}