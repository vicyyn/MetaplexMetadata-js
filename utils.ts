import { deserializeUnchecked, BinaryReader, BinaryWriter } from 'borsh';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js'
import base58 from 'bs58'

export type StringPublicKey = string;

export const extendBorsh = () => {
	(BinaryReader.prototype as any).readPubkey = function () {
		const reader = this as unknown as BinaryReader;
		const array = reader.readFixedArray(32);
		return new PublicKey(array);
	};

	(BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
		const writer = this as unknown as BinaryWriter;
		writer.writeFixedArray(value.toBuffer());
	};

	(BinaryReader.prototype as any).readPubkeyAsString = function () {
		const reader = this as unknown as BinaryReader;
		const array = reader.readFixedArray(32);
		return base58.encode(array) as StringPublicKey;
	};

	(BinaryWriter.prototype as any).writePubkeyAsString = function (
		value: StringPublicKey,
	) {
		const writer = this as unknown as BinaryWriter;
		writer.writeFixedArray(base58.decode(value));
	};
};

extendBorsh();


export const METADATA_PREFIX = 'metadata';
export const EDITION = 'edition';
export const RESERVATION = 'reservation';

export const MAX_NAME_LENGTH = 32;

export const MAX_SYMBOL_LENGTH = 10;

export const MAX_URI_LENGTH = 200;

export const MAX_CREATOR_LIMIT = 5;

export const MAX_CREATOR_LEN = 32 + 1 + 1;
export const MAX_METADATA_LEN =
	1 +
	32 +
	32 +
	MAX_NAME_LENGTH +
	MAX_SYMBOL_LENGTH +
	MAX_URI_LENGTH +
	MAX_CREATOR_LIMIT * MAX_CREATOR_LEN +
	2 +
	1 +
	1 +
	198;

export const MAX_EDITION_LEN = 1 + 32 + 8 + 200;

export const EDITION_MARKER_BIT_SIZE = 248;

export enum MetadataKey {
	Uninitialized = 0,
	MetadataV1 = 4,
	EditionV1 = 1,
	MasterEditionV1 = 2,
	MasterEditionV2 = 6,
	EditionMarker = 7,
}

export class Uses {
	useMethod: number;
	/// Points at MasterEdition struct
	remaining: typeof BN;
	/// Starting at 0 for master record, this is incremented for each edition minted.
	total: typeof BN;

	constructor(args: {
		useMethod: number;
		remaining: typeof BN;
		total: typeof BN;
	}) {
		this.useMethod = args.useMethod
		this.remaining = args.remaining;
		this.total = args.total;
	}
}
export class Creator {
	address: StringPublicKey;
	verified: boolean;
	share: number;

	constructor(args: {
		address: StringPublicKey;
		verified: boolean;
		share: number;
	}) {
		this.address = args.address;
		this.verified = args.verified;
		this.share = args.share;
	}
}

export class Data {
	name: string;
	symbol: string;
	uri: string;
	sellerFeeBasisPoints: number;
	creators: Creator[] | null;
	constructor(args: {
		name: string;
		symbol: string;
		uri: string;
		sellerFeeBasisPoints: number;
		creators: Creator[] | null;
	}) {
		this.name = args.name;
		this.symbol = args.symbol;
		this.uri = args.uri;
		this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
		this.creators = args.creators;
	}
}

export class Collection {
	key: StringPublicKey;
	verified: boolean;
	constructor(args: { verified: boolean, key: StringPublicKey }) {
		this.key = args.key;
		this.verified = args.verified;
	}
}

export class Metadata {
	key: MetadataKey;
	updateAuthority: StringPublicKey;
	mint: StringPublicKey;
	data: Data;
	primarySaleHappened: boolean;
	isMutable: boolean;
	editionNonce: number | null;
	tokenStandard: number;
	collection: Collection;
	asd : string;
	uses: Uses;

	constructor(args: {
		updateAuthority: StringPublicKey;
		mint: StringPublicKey;
		data: Data;
		primarySaleHappened: boolean;
		isMutable: boolean;
		editionNonce: number | null;
		uses: Uses;
		tokenStandard: number;
		collection: Collection;
	}) {
		this.key = MetadataKey.MetadataV1;
		this.updateAuthority = args.updateAuthority;
		this.mint = args.mint;
		this.data = args.data;
		this.primarySaleHappened = args.primarySaleHappened;
		this.isMutable = args.isMutable;
		this.editionNonce = args.editionNonce;
		this.tokenStandard = args.tokenStandard;
		this.collection = args.collection;
		this.uses = args.uses;
	}
}

export const METADATA_SCHEMA = new Map<any, any>([
	[
		Uses,
		{
			kind: 'struct',
			fields: [
				['useMethod', 'u8'],
				['remaining', 'u64'],
				['total','u64'],
			],
		},
	],
	[
		Data,
		{
			kind: 'struct',
			fields: [
				['name', 'string'],
				['symbol', 'string'],
				['uri', 'string'],
				['sellerFeeBasisPoints', 'u16'],
				['creators', { kind: 'option', type: [Creator] }],
			],
		},
	],
	[
		Creator,
		{
			kind: 'struct',
			fields: [
				['address', 'pubkeyAsString'],
				['verified', 'u8'],
				['share', 'u8'],
			],
		},
	],
	[
		Collection,
		{
			kind: 'struct',
			fields: [
				['verified', 'u8'],
				['key', 'pubkeyAsString'],
			],
		},
	],

	[
		Metadata,
		{
			kind: 'struct',
			fields: [
				['key', 'u8'],
				['updateAuthority', 'pubkeyAsString'],
				['mint', 'pubkeyAsString'],
				['data', Data],
				['primarySaleHappened', 'u8'], // bool
				['isMutable', 'u8'], // bool
				['editionNonce', { kind: 'option', type: 'u8' }],
				['tokenStandard', { kind: 'option', type: 'u8' }],
				['collection', { kind: 'option', type: Collection }],
				['uses', Uses],
			],
		},
	],
]);

// eslint-disable-next-line no-control-regex
const METADATA_REPLACE = new RegExp('\u0000', 'g');

export const decodeMetadata = (buffer: Buffer): Metadata => {
	console.log(Metadata.length)
	const metadata = deserializeUnchecked(
		METADATA_SCHEMA,
		Metadata,
		buffer,
	) as Metadata;
	metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
	metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
	metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
	return metadata;
};
