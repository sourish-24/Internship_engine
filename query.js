import * as dotenv from 'dotenv';
dotenv.config();

import readlineSync from 'readline-sync';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';

import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});  // automatically reads GEMINI_API_KEY from .env


async function chatting(query) {
    // convert user query into vector
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'text-embedding-004',
    });

    const queryVector = await embeddings.embedQuery(query);

    // connect to pineconeDB
    const pinecone = new Pinecone();

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const searchResults = await pineconeIndex.query({
        topK: 10,
        vector: queryVector,
        includeMetadata: true,
    });

    console.log(searchResults)
}


async function main() {
    while (true) {
        const userQuery = readlineSync.question("enter student parameters data --> ");
        if (userQuery.toLowerCase() === "exit") {
            console.log("Goodbye!");
            break;
        }
        await chatting(userQuery);
    }
}

main();