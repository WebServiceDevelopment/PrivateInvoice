const qs = require('qs');
let stringifyStr , parseStr;

        const params1 = [
            {
                archive : 0,
                folder : 'draft',
                role : 'seller',
                type : 'invoice'
            }
        ]

stringifyStr = qs.stringify(params1);
console.log(stringifyStr);

parseStr = qs.parse(stringifyStr);
console.log(parseStr);

        const params2 = [
            { type : "invoice", role : "buyer", folder : "sent", archive : 0 },
            { type : "invoice", role : "buyer", folder : "returned", archive : 0 },
            { type : "invoice", role : "buyer", folder : "confirmed", archive : 0 },
            { type : "invoice", role : "buyer", folder : "paid", archive : 0 }
        ];

stringifyStr = qs.stringify(params2);
console.log(stringifyStr);

parseStr = qs.parse(stringifyStr);
console.log(parseStr);

console.log("parseStr[0]="+parseStr[0].type+":"+parseStr[0].role+":"+parseStr[0].folder+":"+parseStr[0].archive);
console.log("parseStr[1]="+parseStr[1].type+":"+parseStr[1].role+":"+parseStr[1].folder+":"+parseStr[1].archive);

