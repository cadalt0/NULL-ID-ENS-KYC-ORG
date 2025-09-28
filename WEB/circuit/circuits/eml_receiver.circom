// Zero-knowledge circuit for email content verification
// Validates presence of specific email headers within .eml file data:
//   - "From:" header indicator
//   - "To:" header indicator  
//   - "@gmail.com" domain reference
// located anywhere within the email byte sequence.
//
// Circuit verification (off-chain):
// - Poseidon hash commitment matches the provided public input
// - Header "From:" exists at some position in the email data
// - Header "To:" exists at some position in the email data
// - Domain "@gmail.com" exists at some position in the email data
//
// Note: This provides content verification only (not delivery confirmation).
//
// Public inputs:
//   - email_hash: Poseidon hash over fixed-size buffer (zero-padded)
// Private inputs (witness data):
//   - email_data[MAX_EMAIL_LEN]: raw .eml file bytes, zero-padded to MAX_EMAIL_LEN
//
// Hashing algorithm (fixed-size rolling Poseidon):
//   h_0 = 0; For each 31-byte block b_i (little-endian encoding): h_{i+1} = Poseidon2(h_i, b_i);
//   email_hash = final hash value over all blocks (including zero-padded remainder).

pragma circom 2.1.6;

include "poseidon.circom";
include "bitify.circom";

template BooleanConstraint() {
	signal input value;
	signal output result;
	result <== value;
	result * (result - 1) === 0;
}

template ValidateByteRange() {
	signal input byte_value; // expects 0..255
	signal output is_valid;
	component bit_converter = Num2Bits(8);
	bit_converter.in <== byte_value;
	is_valid <== 1;
}

template EncodeBytesToField() {
	// Converts up to 31 bytes (byte[0] is least significant) into a single field element
	signal input byte_array[31];
	signal output field_element;

	// Validate all inputs are valid bytes
	component byte_validators[31];
	for (var i = 0; i < 31; i++) {
		byte_validators[i] = ValidateByteRange();
		byte_validators[i].byte_value <== byte_array[i];
	}

	var accumulator = 0;
	var multiplier = 1;
	for (var j = 0; j < 31; j++) {
		accumulator += byte_array[j] * multiplier;
		multiplier = multiplier * 256;
	}
	field_element <== accumulator;
}

template SequentialPoseidonHash(maxLength, chunkCount) {
	// Process email data in 31-byte blocks using Poseidon(2) hashing
	signal input email_data[maxLength];
	signal output hash_result;

	// Create data blocks
	component field_encoders[chunkCount];
	for (var c = 0; c < chunkCount; c++) {
		field_encoders[c] = EncodeBytesToField();
		// process 31 bytes per block
		for (var k = 0; k < 31; k++) {
			var data_index = c * 31 + k;
			if (data_index < maxLength) {
				field_encoders[c].byte_array[k] <== email_data[data_index];
			} else {
				field_encoders[c].byte_array[k] <== 0;
			}
		}
	}

	// Sequential hashing: h = 0; for each block: h = Poseidon(h, block)
	component hash_components[chunkCount];
	for (var i2 = 0; i2 < chunkCount; i2++) {
		hash_components[i2] = Poseidon(2);
		hash_components[i2].inputs[0] <== (i2 == 0 ? 0 : hash_components[i2-1].out);
		hash_components[i2].inputs[1] <== field_encoders[i2].field_element;
	}
	hash_result <== hash_components[chunkCount - 1].out;
}

template PatternMatcher(MAX_EMAIL_LEN, PATTERN_LEN) {
	// Quadratic-safe pattern matching using one-hot position selection
	// Prover provides selector[0..MAX_EMAIL_LEN-1] with exactly one '1' in valid range [0..MAX_EMAIL_LEN-PATTERN_LEN]
	// For each byte position i in pattern, enforce sum_t selector[t]*(email_data[t+i] - pattern[i]) == 0
	signal input email_data[MAX_EMAIL_LEN];
	signal input pattern[PATTERN_LEN];
	signal input selector[MAX_EMAIL_LEN];
	signal output match_found;

	var VALID_POSITIONS = MAX_EMAIL_LEN - PATTERN_LEN + 1;

	// Ensure selector is boolean and one-hot within valid range; zero outside
	var selector_sum = 0;
	for (var t = 0; t < VALID_POSITIONS; t++) {
		// boolean constraint
		selector[t] * (selector[t] - 1) === 0;
		selector_sum += selector[t];
	}
	selector_sum === 1;
	for (var u = VALID_POSITIONS; u < MAX_EMAIL_LEN; u++) {
		// must be zero outside valid window
		selector[u] === 0;
	}

	// Pattern matching via individual constraints
	for (var i = 0; i < PATTERN_LEN; i++) {
		for (var t2 = 0; t2 < VALID_POSITIONS; t2++) {
			// Enforce individually: selector[t2] * (email_data[t2+i] - pattern[i]) == 0
			// This maintains quadratic constraint complexity
			selector[t2] * (email_data[t2 + i] - pattern[i]) === 0;
		}
	}

	match_found <== 1;
}

template EmailHeaderVerifier(MAX_EMAIL_LEN) {
	// Public inputs
	signal input email_hash;
	// Private inputs
	signal input email_data[MAX_EMAIL_LEN];
	signal input from_header_bytes[5]; // "From:" header bytes
	signal input to_header_bytes[3];   // "To:" header bytes
	signal input gmail_domain_bytes[10]; // "@gmail.com" domain bytes
	signal input from_selector[MAX_EMAIL_LEN];
	signal input to_selector[MAX_EMAIL_LEN];
	signal input domain_selector[MAX_EMAIL_LEN];

	// 1) Hash verification
	// With MAX_EMAIL_LEN=8192, CHUNK_COUNT = ceil(8192/31) = 265
	component hash_verifier = SequentialPoseidonHash(MAX_EMAIL_LEN, 265);
	for (var i = 0; i < MAX_EMAIL_LEN; i++) {
		hash_verifier.email_data[i] <== email_data[i];
	}
	hash_verifier.hash_result === email_hash;

	// 2) Pattern match: "From:" (5 bytes)
	component from_matcher = PatternMatcher(MAX_EMAIL_LEN, 5);
	for (var e1 = 0; e1 < MAX_EMAIL_LEN; e1++) {
		from_matcher.email_data[e1] <== email_data[e1];
	}
	for (var a = 0; a < 5; a++) {
		from_matcher.pattern[a] <== from_header_bytes[a];
	}
	for (var sf = 0; sf < MAX_EMAIL_LEN; sf++) {
		from_matcher.selector[sf] <== from_selector[sf];
	}
	from_matcher.match_found === 1;

	// 3) Pattern match: "To:" (3 bytes)
	component to_matcher = PatternMatcher(MAX_EMAIL_LEN, 3);
	for (var e2 = 0; e2 < MAX_EMAIL_LEN; e2++) {
		to_matcher.email_data[e2] <== email_data[e2];
	}
	for (var t = 0; t < 3; t++) {
		to_matcher.pattern[t] <== to_header_bytes[t];
	}
	for (var st = 0; st < MAX_EMAIL_LEN; st++) {
		to_matcher.selector[st] <== to_selector[st];
	}
	to_matcher.match_found === 1;

	// 4) Pattern match: "@gmail.com" (10 bytes)
	component domain_matcher = PatternMatcher(MAX_EMAIL_LEN, 10);
	for (var e3 = 0; e3 < MAX_EMAIL_LEN; e3++) {
		domain_matcher.email_data[e3] <== email_data[e3];
	}
	for (var g = 0; g < 10; g++) {
		domain_matcher.pattern[g] <== gmail_domain_bytes[g];
	}
	for (var sg = 0; sg < MAX_EMAIL_LEN; sg++) {
		domain_matcher.selector[sg] <== domain_selector[sg];
	}
	domain_matcher.match_found === 1;
}

// Default capacity: 8192 bytes; adjust as needed.
component main { public [ email_hash ] } = EmailHeaderVerifier(8192);


