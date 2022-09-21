export const createDynamoDBUpdateParams = (
    updateObject: any, 
    emailAddress: string,
    token: string = '',
    nameOfTokenToCheck: string = ''
    ) => {
    // If valid user record data, put to DB
    let params = {
        TableName: process.env.TV_SHOWS_TABLE_NAME || '',
        Key: {},
        ExpressionAttributeValues: {},
        ExpressionAttributeNames: {},
        UpdateExpression: "",
        ReturnValues: "ALL_NEW"
    };

    const idAttributeName = 'emailAddress'
    params["Key"][idAttributeName] = emailAddress;

    let prefix = "set ";
    const updateParams = updateObject
    console.log(`Update params: ${JSON.stringify(updateParams)}`)

    let attributes = Object.keys(updateParams);
    let conditionExpression = ''
    if(token){
        params["ConditionExpression"] = `:last${nameOfTokenToCheck} = :${nameOfTokenToCheck}`
        params["ExpressionAttributeNames"][`#${nameOfTokenToCheck}`] = nameOfTokenToCheck
        params["ExpressionAttributeValues"][`:last${nameOfTokenToCheck}`] = token
    }
    for (let i = 0; i < attributes.length; i++) {
        let attribute = attributes[i];
        // Prevent emailAddress, password and token to be updated
        if (attribute != idAttributeName) {
            params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute;
            params["ExpressionAttributeValues"][":" + attribute] = updateObject[attribute];
            params["ExpressionAttributeNames"]["#" + attribute] = attribute;
            prefix = ", ";
        }
    }

    console.log(`Params after running through loop ${JSON.stringify(params)}`)
    return params
}
