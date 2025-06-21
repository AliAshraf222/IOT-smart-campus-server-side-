import fs from "fs";
import path from "path";

export const initializeJsonFile = (filePath: string): void=>{
    try {
        // directory
        if(!fs.existsSync(path.dirname(filePath))){
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // file
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath, "[]", "utf-8");
            console.log(`File ${path.basename(filePath)} created successfully`);
        }else{
            try {
                const content = fs.readFileSync(filePath, "utf-8");
                if(!content || content.trim() === ""){
                    fs.writeFileSync(filePath, "[]", "utf-8");
                }else{
                 JSON.parse(content);   
                }
            } catch (error) {
                console.log(error);
            }
        } 

    } catch (error) {
        console.log(error);
    }
}

export const readFileSync = (filePath: string) => {
    return fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
};