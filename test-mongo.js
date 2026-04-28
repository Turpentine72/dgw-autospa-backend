const { MongoClient, ServerApiVersion } = require('mongodb'); 
const uri = "mongodb://dgw-autospa72:BRDt8baKem3mh77y@ac-9habgvz-shard-00-00.scpfyqg.mongodb.net:27017,ac-9habgvz-shard-00-01.scpfyqg.mongodb.net:27017,ac-9habgvz-shard-00-02.scpfyqg.mongodb.net:27017/?ssl=true&replicaSet=atlas-14ahid-shard-0&authSource=admin&appName=Dgw-autospa&tlsAllowInvalidCertificates=true"; 
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } }); 
