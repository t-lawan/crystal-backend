import { DynamoDB, AWSError } from 'aws-sdk';

export class DatabaseService {
    private tableName: string;
    dynamoDBDocuClient: DynamoDB.DocumentClient;


    constructor(tableName: string = process.env.USER_DYNAMODB_TABLE || process.env.CRYSTAL_DYNAMODB_TABLE) {
        this.tableName = tableName;
    }

    getItem =  async(id: string) : Promise<any> => {
        const params = {
            TableName: this.tableName,
            Key: {
                id: id
            }
        };

        return this.dynamoDBDocuClient.get(params).promise();
    }

    getAllItems = async (): Promise<any>  => {
        const params = {
            TableName: this.tableName
        }

        return this.dynamoDBDocuClient.scan(params).promise();
    }

    putItem = async (item): Promise<any> => {
        const params = {
            TableName: this.tableName,
            Item: item
        };

        return this.dynamoDBDocuClient.put(params).promise();
    }

    updateItem = async (id: string, expression: object) : Promise<any> => {
        const updateExpression: string = this.generateUpdateExpression(Object.keys(expression));
        const expressionAttributeValues = this.generateExpressionAttributeValues(expression);
        const params = {
            TableName: this.tableName,
            Key: {
                id: id
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "UPDATED_NEW"
        };

        return this.dynamoDBDocuClient.update(params).promise();

    }
    scan = async (expression: object): Promise<any> => {
        const filterExpression: string = this.generateFilterExpression(Object.keys(expression));
        const expressionAttributeValues = this.generateExpressionAttributeValues(expression);
        const params = {
            TableName: this.tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues
        }

        return this.dynamoDBDocuClient.scan(params).promise();
    }

    private generateFilterExpression = (items: string[]): string => {
        let response: string = '';
        items.forEach((item, index) => {
            response += `${item} = :${item}`;
            if (index !== items.length - 1) {
                response += ' and ';
            }
        });
        return response;
    }

    private generateUpdateExpression = (items: string[]): string => {
        let response: string = '';
        items.forEach((item, index) => {
            if(index === 0) {
                response += 'SET ';
            }
            response += `${item} = :${item}`;

            if (index !== items.length - 1) {
                response += ','
            }
        }); 

        return response;
    }

    private generateExpressionAttributeValues = (items: object): object => {
        let response: {[key: string]: any} = {}; 
        Object.keys(items).map((item) => {
            response[`:${item}`] = items[item];
        });
        return response
    }


}