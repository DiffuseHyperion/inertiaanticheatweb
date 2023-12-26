import {useEffect, useState} from "react";
import {Algorithm} from "./Algorithm";
import Mod from "./Mod";
import {copyText} from "./index";
import { createMD5, createSHA1, createSHA256 } from "hash-wasm"
import {IHasher} from "hash-wasm/dist/lib/WASMInterface";

interface Props {
    mod: Mod
}

const chunkSize = 64 * 1024 * 1024;

function hashChunk(chunk: Blob, hasher: IHasher, fileReader: FileReader): Promise<void> {
    return new Promise((resolve) => {
        fileReader.onload = (e) => {
            const view = new Uint8Array(e.target!.result as ArrayBuffer);
            hasher.update(view);
            resolve();
        };

        fileReader.readAsArrayBuffer(chunk);
    });
}

async function readFile(file: File, algorithm: Algorithm) {
    let hasher: IHasher
    switch (algorithm) {
        case Algorithm.MD5:
            hasher = await createMD5();
            break
        case Algorithm.SHA1:
            hasher = await createSHA1();
            break
        case Algorithm.SHA256:
            hasher = await createSHA256();
            break
    }
    const fileReader: FileReader = new FileReader();
    const chunkNumber = Math.floor(file.size / chunkSize);

    for (let i = 0; i <= chunkNumber; i++) {
        let chunk: Blob = file.slice(
            chunkSize * i,
            Math.min(chunkSize * (i + 1), file.size)
        );
        await hashChunk(chunk, hasher, fileReader);
    }

    const hash = hasher.digest();
    return Promise.resolve(hash);
}


export default function ModComponent(props: Props) {
    const [checksum, setChecksum] = useState<string>()

    function updateChecksum(checksum: string) {
        setChecksum(checksum)
        props.mod.checksum = checksum
    }

    useEffect(() => {
        readFile(props.mod.file, props.mod.algorithm).then((result) => updateChecksum(result))
    }, [props.mod.file, props.mod.algorithm]);

    return (
        <div className="w-full h-24 bg-white text-black rounded-3xl p-3 pl-8 pr-8 flex flex-row items-center justify-between">
            <div className="flex flex-row space-x-3 items-center">
                <h1 className="text-2xl font-bold">{props.mod.file.name}</h1>
                <h2 className="text-xl">Checksum:</h2>
                <p onClick={() => copyText(checksum)} className="underline cursor-pointer" title="Click me to copy!">{checksum ? checksum : "Calculating..."}</p>
            </div>
            <div className="flex flex-row space-x-3 justify-center items-center">
            <p>Soft-whitelist?</p>
                <input className={"p-3"} onChange={() => props.mod.softWhitelist = !props.mod.softWhitelist} type="checkbox"/>
            </div>
        </div>
    )
}