export class ResponseService {
    static success = (data: object | string) => {
        let body = {
            data: data,
            error: null,
        }
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify(body)
        }
    }

    static error = (message: string, statusCode: number) => {
        return {
            statusCode: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: {
                   message: message
                }
            })
                
        }
    }
}