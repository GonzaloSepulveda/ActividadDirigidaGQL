import { MongoClient, ObjectId } from "mongodb";
import { vueloModel, type vuelo } from "./types.ts";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { fromModelToVuelo } from "./utils.ts";






const MONGO_URL = Deno.env.get("MONGO_URL")

if(!MONGO_URL){
  console.log("URL incorrecta");
  Deno.exit(-1); 
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Cliente conectado correctamente");


const db = client.db("vuelos");
const vueloCollection = db.collection<vueloModel>("vuelo");

const schemaGQL = `#graphql

  type vuelo{
    id:ID!,
    origen:String,
    destino:String!,
    fecha:String!
  }

  type Query{
    getFlights(origen:String,destino:String):[vuelo]!
    getFlight(id:ID!):vuelo
  }

  type Mutation{
    addFlight(origen:String,destino:String,fecha:String):vuelo!
  }
`;


const resolvers = {
  Query: {
    getFlights:async(_:unknown,{origen,destino}:{origen:string,destino:string}):Promise<vuelo[]> => {
      if(!origen && destino){
        const vuelos = await vueloCollection.find({destino}).toArray();
        const vuelo = await Promise.all(vuelos.map((v)=>fromModelToVuelo(v)))
        return vuelo
      }
      else if(origen && !destino){
        const vuelos = await vueloCollection.find({origen}).toArray();
        const vuelo = await Promise.all(vuelos.map((v)=>fromModelToVuelo(v)))
        return vuelo
      }
      else if(destino && origen){
        const vuelos = await vueloCollection.find({origen,destino}).toArray();
        const vuelo = await Promise.all(vuelos.map((v)=>fromModelToVuelo(v)))
        return vuelo
      } else{
      const vuelos = await vueloCollection.find().toArray();
        const vuelo = await Promise.all(vuelos.map((v)=>fromModelToVuelo(v)))
        return vuelo
      }
    },
    getFlight:async(_:unknown,{id}:{id:string}) => {
      const vuelo = await vueloCollection.findOne({_id:new ObjectId(id)});
      if(!vuelo){return null};
      return fromModelToVuelo(vuelo); 
    }
  },
  Mutation: {
    addFlight:async(_:unknown,{origen,destino,fecha}:{origen:string,destino:string,fecha:string})=>{
      const vuelo = await vueloCollection.insertOne({origen,destino,fecha});
      return{
        id:vuelo.insertedId.toString,
        origen,
        destino,
        fecha,
      };
    }
  }

}


const server = new ApolloServer({ typeDefs: schemaGQL, resolvers:resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 3000 },
});
console.log(`Server running on: ${url}`);