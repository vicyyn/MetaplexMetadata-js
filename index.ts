import { decodeMetadata } from './utils'
import { PublicKey } from '@solana/web3.js'
import 'isomorphic-fetch';

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const get_metadataPda = async (address:PublicKey) => {
	let [pda, bump] = await PublicKey.findProgramAddress([
		Buffer.from("metadata"),
		METADATA_PUBKEY.toBuffer(),
		address.toBuffer(),
	], METADATA_PUBKEY)
	return pda
}

async function getTokenMetadata(token_address:string) {
	try {
		const token_publickey = new PublicKey(token_address)
		const metadata_pda = await get_metadataPda(token_publickey);

		const data = {
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getAccountInfo",
			"params": [
				metadata_pda.toBase58(),
				{
					"encoding": "base64"
				}
			]
		}

		const metadata_res = await fetch("https://api.mainnet-beta.solana.com", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
		}); 
		const metadata_parsed = await metadata_res.json();
		const metadata_buf = Buffer.from(metadata_parsed.result.value.data[0], 'base64');
		const metadata = decodeMetadata(metadata_buf)
		console.log(metadata)

		const arweave_res = await fetch(metadata.data.uri)
		const arweave= await arweave_res.json()
		console.log("Arweave ",arweave)

		return { metadata ,arweave} 

	} catch (e) {
		console.log(e)
	}
}

getTokenMetadata(process.argv[2])
