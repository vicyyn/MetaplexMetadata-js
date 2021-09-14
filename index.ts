import { decodeMetadata } from './utils'
import { PublicKey } from '@solana/web3.js'
// @ts-ignore
import fetch from 'node-fetch'



const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function getNft() {
	try {
		// input mint here
		let address = new PublicKey("DqGGFuiWRiJ6Mim1qafLWn6FZzBGGcSTyFFSJ8RpuqE8")
		let [pda, bump] = await PublicKey.findProgramAddress([
			Buffer.from("metadata"),
			METADATA_PUBKEY.toBuffer(),
			new PublicKey(address).toBuffer(),
		], METADATA_PUBKEY)
		console.log(pda.toBase58())

		const data = {
			"jsonrpc": "2.0",
			"id": 1,
			"method": "getAccountInfo",
			"params": [
				pda.toBase58(),
				{
					"encoding": "base64"
				}
			]
		}
		await fetch("https://api.mainnet-beta.solana.com", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
		}).then((res) => res.json())
			.then((data: any) => {
				let buf = Buffer.from(data.result.value.data[0], 'base64')
				let m = decodeMetadata(buf)
				console.log(m)
				fetch(m.data.uri).then(
					(res) => res.json()).then((data) => {
						console.log(data)
					})
			}).catch((e) => {
				console.log(e)
			})
	} catch (e) {
		console.log(e)
	}
}

getNft()