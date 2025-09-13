import * as dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from "langchain/document";

import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});  //automatically reads GEMINI_API_KEY from .env


async function indexDocument() {
    //convert user query into vector

    const profiles = [
        { skills: ["python", "flask"], jobSector: "ai dev", education: "btech", location: "delhi" },
        { skills: ["java", "spring"], jobSector: "backend dev", education: "mtech", location: "mumbai" },
        { skills: ["javascript", "react", "node.js"], jobSector: "fullstack dev", education: "btech", location: "bangalore" },
        { skills: ["c++", "opencv", "tensorflow"], jobSector: "computer vision engineer", education: "phd", location: "hyderabad" },
        { skills: ["aws", "docker", "kubernetes"], jobSector: "cloud architect", education: "mtech", location: "pune" },
        { skills: ["html", "css", "javascript"], jobSector: "frontend dev", education: "btech", location: "chennai" },
        { skills: ["sql", "tableau", "python"], jobSector: "data analyst", education: "mba", location: "gurgaon" },
        { skills: ["pytorch", "nlp", "transformers"], jobSector: "nlp engineer", education: "phd", location: "delhi" },
        { skills: ["golang", "microservices", "grpc"], jobSector: "backend dev", education: "btech", location: "mumbai" },
        { skills: ["flutter", "dart", "firebase"], jobSector: "mobile app dev", education: "btech", location: "bangalore" },
        { skills: ["swift", "ios", "xcode"], jobSector: "ios dev", education: "btech", location: "pune" },
        { skills: ["kotlin", "android", "jetpack"], jobSector: "android dev", education: "diploma", location: "hyderabad" },
        { skills: ["unity", "c#", "blender"], jobSector: "game dev", education: "btech", location: "chennai" },
        { skills: ["solidity", "ethereum", "web3"], jobSector: "blockchain dev", education: "mtech", location: "delhi" },
        { skills: ["rust", "substrate", "polkadot"], jobSector: "blockchain engineer", education: "btech", location: "mumbai" },
        { skills: ["cybersecurity", "networking", "linux"], jobSector: "security analyst", education: "btech", location: "bangalore" },
        { skills: ["penetration testing", "burpsuite", "python"], jobSector: "ethical hacker", education: "diploma", location: "pune" },
        { skills: ["devops", "jenkins", "terraform"], jobSector: "devops engineer", education: "mtech", location: "hyderabad" },
        { skills: ["big data", "hadoop", "spark"], jobSector: "big data engineer", education: "btech", location: "kolkata" },
        { skills: ["data science", "r", "python"], jobSector: "data scientist", education: "phd", location: "delhi" },
        { skills: ["cloud", "azure", "terraform"], jobSector: "cloud engineer", education: "mtech", location: "noida" },
        { skills: ["ui/ux", "figma", "adobe xd"], jobSector: "ui/ux designer", education: "btech", location: "bangalore" },
        { skills: ["mlops", "mlflow", "docker"], jobSector: "mlops engineer", education: "btech", location: "pune" },
        { skills: ["javascript", "vue.js", "tailwind"], jobSector: "frontend dev", education: "diploma", location: "mumbai" },
        { skills: ["php", "laravel", "mysql"], jobSector: "backend dev", education: "btech", location: "chennai" },
        { skills: ["scala", "spark", "kafka"], jobSector: "data engineer", education: "mtech", location: "hyderabad" },
        { skills: ["robotics", "ros", "python"], jobSector: "robotics engineer", education: "phd", location: "bangalore" },
        { skills: ["vr", "unity", "c#"], jobSector: "vr developer", education: "btech", location: "gurgaon" },
        { skills: ["arcore", "arkit", "three.js"], jobSector: "ar developer", education: "btech", location: "delhi" },
        { skills: ["embedded c", "arduino", "raspberry pi"], jobSector: "embedded systems engineer", education: "mtech", location: "pune" },
        { skills: ["cobol", "mainframe", "jcl"], jobSector: "legacy systems dev", education: "btech", location: "chennai" },
        { skills: ["perl", "bash", "linux"], jobSector: "scripting engineer", education: "self-taught", location: "hyderabad" },
        { skills: ["ai", "chatgpt", "llms"], jobSector: "prompt engineer", education: "mba", location: "bangalore" },
        { skills: ["typescript", "angular", "rxjs"], jobSector: "frontend dev", education: "btech", location: "noida" },
        { skills: ["django", "python", "postgres"], jobSector: "backend dev", education: "btech", location: "delhi" },
        { skills: ["express", "node.js", "mongodb"], jobSector: "fullstack dev", education: "btech", location: "mumbai" },
        { skills: ["ansible", "puppet", "saltstack"], jobSector: "devops engineer", education: "mtech", location: "bangalore" },
        { skills: ["sap", "abap", "hana"], jobSector: "sap consultant", education: "mba", location: "pune" },
        { skills: ["salesforce", "apex", "lwc"], jobSector: "crm developer", education: "btech", location: "gurgaon" },
        { skills: ["power bi", "sql", "excel"], jobSector: "business analyst", education: "mba", location: "delhi" },
        { skills: ["matlab", "simulink", "control systems"], jobSector: "control engineer", education: "phd", location: "hyderabad" },
        { skills: ["fortran", "numerical analysis"], jobSector: "scientific programmer", education: "phd", location: "chennai" },
        { skills: ["rust", "wasm", "webassembly"], jobSector: "systems dev", education: "btech", location: "bangalore" },
        { skills: ["graphql", "apollo", "node.js"], jobSector: "api developer", education: "btech", location: "mumbai" },
        { skills: ["nlp", "chatbots", "python"], jobSector: "conversational ai dev", education: "mtech", location: "delhi" },
        { skills: ["genomics", "bioinformatics", "r"], jobSector: "bioinformatics scientist", education: "phd", location: "pune" },
        { skills: ["autocad", "solidworks", "catia"], jobSector: "cad engineer", education: "btech", location: "noida" },
        { skills: ["mechanical", "ansys", "matlab"], jobSector: "mechanical engineer", education: "mtech", location: "gurgaon" },
        { skills: ["electrical", "proteus", "multisim"], jobSector: "electrical engineer", education: "btech", location: "chennai" },
        { skills: ["civil3d", "revit", "staad"], jobSector: "civil engineer", education: "btech", location: "mumbai" },
        { skills: ["hadoop", "pig", "hive"], jobSector: "big data engineer", education: "btech", location: "bangalore" },
        { skills: ["spark", "kafka", "scala"], jobSector: "data pipeline engineer", education: "mtech", location: "delhi" },
        { skills: ["neo4j", "graph db", "cypher"], jobSector: "graph database engineer", education: "btech", location: "hyderabad" },
        { skills: ["tensorflow", "keras", "python"], jobSector: "ml engineer", education: "mtech", location: "pune" },
        { skills: ["c#", ".net", "asp.net"], jobSector: "backend dev", education: "btech", location: "chennai" },
        { skills: ["typescript", "nestjs", "graphql"], jobSector: "backend dev", education: "btech", location: "bangalore" },
        { skills: ["d3.js", "chart.js", "javascript"], jobSector: "data visualization dev", education: "btech", location: "gurgaon" },
        { skills: ["tensorflow", "keras", "mlops"], jobSector: "mlops engineer", education: "phd", location: "mumbai" },
        { skills: ["cyber forensics", "python", "wireshark"], jobSector: "forensics analyst", education: "mtech", location: "delhi" },
        { skills: ["shell scripting", "linux", "devops"], jobSector: "systems engineer", education: "self-taught", location: "hyderabad" },
        { skills: ["robotics", "ai", "control"], jobSector: "robotics engineer", education: "phd", location: "pune" },
        { skills: ["sap", "fi/co", "hana"], jobSector: "sap consultant", education: "mba", location: "bangalore" },
        { skills: ["cloud", "gcp", "kubernetes"], jobSector: "cloud architect", education: "mtech", location: "noida" },
        { skills: ["seo", "digital marketing", "google ads"], jobSector: "marketing specialist", education: "mba", location: "delhi" },
        { skills: ["content writing", "wordpress", "seo"], jobSector: "content strategist", education: "btech", location: "gurgaon" },
        { skills: ["copywriting", "branding", "creativity"], jobSector: "copywriter", education: "self-taught", location: "mumbai" },
        { skills: ["journalism", "editing", "research"], jobSector: "editor", education: "mba", location: "chennai" },
        { skills: ["film editing", "after effects", "premiere pro"], jobSector: "video editor", education: "diploma", location: "hyderabad" },
        { skills: ["3d modeling", "maya", "blender"], jobSector: "3d artist", education: "btech", location: "pune" },
        { skills: ["photography", "photoshop", "lightroom"], jobSector: "photographer", education: "diploma", location: "delhi" },
        { skills: ["music production", "logic pro", "mixing"], jobSector: "music producer", education: "self-taught", location: "bangalore" },
        { skills: ["finance", "excel", "python"], jobSector: "financial analyst", education: "mba", location: "gurgaon" },
        { skills: ["accounting", "sap", "tally"], jobSector: "accountant", education: "bcom", location: "mumbai" },
        { skills: ["ai", "cv", "nlp"], jobSector: "ai researcher", education: "phd", location: "hyderabad" },
        { skills: ["quantum computing", "qiskit", "python"], jobSector: "quantum researcher", education: "phd", location: "delhi" },
        { skills: ["robotics", "automation", "plc"], jobSector: "automation engineer", education: "mtech", location: "pune" },
        { skills: ["iot", "mqtt", "arduino"], jobSector: "iot engineer", education: "btech", location: "bangalore" },
        { skills: ["drone tech", "python", "ros"], jobSector: "drone engineer", education: "btech", location: "chennai" },
        { skills: ["satellite", "aerospace", "matlab"], jobSector: "aerospace engineer", education: "phd", location: "hyderabad" },
        { skills: ["mechanical design", "solidworks", "catia"], jobSector: "design engineer", education: "btech", location: "gurgaon" },
        { skills: ["supply chain", "erp", "analytics"], jobSector: "supply chain analyst", education: "mba", location: "mumbai" },
        { skills: ["hr", "recruitment", "analytics"], jobSector: "hr analyst", education: "mba", location: "delhi" },
        { skills: ["project management", "jira", "scrum"], jobSector: "project manager", education: "mba", location: "pune" },
        { skills: ["entrepreneurship", "startups", "fundraising"], jobSector: "startup founder", education: "self-taught", location: "bangalore" },
        { skills: ["python", "fastapi", "postgres"], jobSector: "backend dev", education: "btech", location: "noida" },
        { skills: ["javascript", "svelte", "node.js"], jobSector: "frontend dev", education: "btech", location: "delhi" },
        { skills: ["c++", "ue4", "blueprints"], jobSector: "game dev", education: "btech", location: "mumbai" },
        { skills: ["ruby", "rails", "postgres"], jobSector: "backend dev", education: "btech", location: "chennai" },
        { skills: ["php", "wordpress", "seo"], jobSector: "web dev", education: "diploma", location: "hyderabad" },
        { skills: ["elm", "functional programming"], jobSector: "frontend dev", education: "self-taught", location: "pune" },
        { skills: ["haskell", "ghc", "category theory"], jobSector: "functional programmer", education: "phd", location: "delhi" },
        { skills: ["scala", "akka", "play framework"], jobSector: "backend dev", education: "mtech", location: "bangalore" },
        { skills: ["clojure", "lisp", "datomic"], jobSector: "backend dev", education: "self-taught", location: "gurgaon" },
        { skills: ["erlang", "otp", "phoenix"], jobSector: "distributed systems engineer", education: "btech", location: "mumbai" },
        { skills: ["ai ethics", "policy", "governance"], jobSector: "ai policy researcher", education: "phd", location: "delhi" }
    ];



    // Convert JSON to LangChain Documents
    const chunkedDocs = profiles.map((p, idx) =>
        new Document({
            pageContent: `Skills: ${p.skills.join(", ")}, Job Sector: ${p.jobSector}, Education: ${p.education}, Location: ${p.location}`,
            metadata: { id: idx, source: "userProfiles" }
        })
    );
    console.log("chunking done")



    //embedding model
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'text-embedding-004',
    });
    console.log("enbedding done")



    //database configure
    //initialise pinecone client
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    //langchain (chunking, embedding, database)
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
        pineconeIndex,
        maxConcurrency: 1,
    });
    console.log("Data Stored in Database")
}
indexDocument();