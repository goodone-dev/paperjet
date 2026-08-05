import xmlFormat from 'xml-formatter';

export function beautify(type: string, value: string): string {
    try {
        let beautified = value;

        if (type === 'json') {
            const parsed = JSON.parse(value);
            beautified = JSON.stringify(parsed, null, 2);
        } else if (type === 'xml' || type === 'html') {
            const opt = {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n',
            }
            beautified = xmlFormat(value, opt);
        }

        return beautified;
    } catch (e) {
        console.error('Failed to beautify code', e);
        return value;
    }
}