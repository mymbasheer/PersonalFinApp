declare module 'react-native-html-to-pdf' {
    export interface Options {
        html: string;
        fileName?: string;
        base64?: boolean;
        directory?: string;
        bgColor?: string;
    }
    export interface PDF {
        filePath?: string;
        base64?: string;
    }
    export function convert(options: Options): Promise<PDF>;
}
