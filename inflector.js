////
//// This file is used from the HTML page, or can be run by itself in Node.
//// It has a section at the end that only runs in Node.
//// The Node-only section reads from a hardcoded filepath, writes to a second
//// hardcoded filepath, and compares the output to a third hardcoded filepath.
//// It also writes to other hardcoded filepaths in between.
////
//// Contents:
//// - Helper functions
//// - Functions for building the output Json
//// - Node-only code
////

////
//// Helper functions
////

/**
 * When lemmata in velut are spelt the same, I include disambiguating information in square brackets, eg "amīcus[adj]" and "amīcus[n]" represent ‘amīcus’ the adjective and ‘amīcus’ the noun.
 * This function removes the brackets if they exist.
 * @param {string} lemma Eg "amīcus[n]"
 * @returns Eg "amīcus"
 */
function removeBrackets(lemma) {
	if (lemma.includes('[')) {
		return lemma.substring(0, lemma.indexOf('['));
	}
	return lemma;
}

/**
 * Deletes macra, acutes, etc from text.
 * This function works by “normalising” characters like "ā" to "a¯" then deleting the diacritic characters.
 * From https://stackoverflow.com/a/37511463
 * @param {string} text Eg "Tibérī"
 * @returns Eg "Tiberi"
 */
function removeDiacritics(text) {
	return `${text}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * In Latin, the enclitics -ne, -que, and -ve can be appended to almost any word.
 * So if ‘amīcus’ exists, ‘amīcusne’, ‘amīcusque’, and ‘amīcusve’ also exist.
 * This function replicates a forms object into four copies, with the enclitics added into the values of the last three copies.
 * If the parameter already has "unencliticized", "ne", "que", or "ve" fields, it is returned without modification.
 * @param {Object} parsingObject Eg {positive: ["amīcus"]}
 * @param {boolean} addIAfterC Controls whether an epenthetic -i- is inserted between final -c and -ne, such as in ‘sīc’ => ‘sīcine’
 * @returns An object with "unencliticized", "ne", "que", "ve" fields, such as {unencliticized: {positive: ["amīcus"]}}, ne: {positive: ["amīcusne"]}}, que: {positive: ["amīcusque"]}}, ve: {positive: ["amīcusve"]}}}
 */
function multiplyWithEnclitics(parsingObject, addIAfterC = false) {
	if (
		parsingObject.unencliticized ||
		parsingObject.ne ||
		parsingObject.que ||
		parsingObject.ve
	) {
		return parsingObject;
	}

	/**
	 * Recursive local function that scans through an object, looking for strings to append the enclitic to.
	 * @param {Object} object Eg {positive: ["amīcus"]}
	 * @param {string} enclitic Eg "ne"
	 * @returns Eg {positive: ["amīcusne"]}
	 */
	function addEnclitic(object, enclitic) {
		try {
			if (!object) {
				console.warn(`parsingObject is ${object} in addEnclitic`);
				return {};
			}

			if (Array.isArray(object)) {
				return object
					.filter((form) => /[aeiouyāēīōūȳ]/i.test(form)) // Forms with no vowels (eg ‘st') should not get an enclitic
					.map((form) => {
						if (typeof form !== 'string') {
							console.warn(
								`Form ${form} is not a string but of type ${typeof form}`,
							);
							return `${form}`;
						}
						if (form.endsWith('c') && addIAfterC && enclitic === 'ne') {
							return removeAcutes(form) + 'i' + enclitic; // Eg "sīc" + "ne" => "sīcine"
						}
						return removeAcutes(form) + enclitic;
					});
			}

			if (typeof object === 'string') {
				console.error(`parsingObject is a string: ${object}`);
				throw `parsingObject is a string: ${object}`;
			}

			// Convert the object into an array of keys and values, map over them adding the enclitic, then convert back into an object.
			return Object.entries(object)
				.filter(([_, obj]) => obj !== null && obj !== undefined)
				.map(([key, obj]) => [key, addEnclitic(obj, enclitic)])
				.reduce((accumulated, current) => {
					accumulated[current[0]] = current[1];
					return accumulated;
				}, {});
		} catch (error) {
			console.error(`Error in addEnclitics(${object}): ${error}`);
			return {};
		}
	}

	return {
		unencliticized: parsingObject,
		ne: addEnclitic(parsingObject, 'ne'),
		que: addEnclitic(parsingObject, 'que'),
		ve: addEnclitic(parsingObject, 've'),
	};
}

/**
 * Returns an object without any of the keys that were included in `unwantedParsings`.
 * This is recursive, so nested objects have their unwanted keys deleted too.
 * @param {Object} formsObject Eg {singular: ["Anglia"], plural: ["Angliae"]}
 * @param {string[]} unwantedParsings Eg ["plural"]
 * @returns Eg {singular: ["Anglia"]}
 */
function deleteUnwantedForms(formsObject, unwantedParsings) {
	if (!unwantedParsings) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside deleteUnwantedForms`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject;
	}
	return Object.entries(formsObject)
		.filter(([key, _]) => !unwantedParsings.includes(key))
		.map(([key, obj]) => [key, deleteUnwantedForms(obj, unwantedParsings)])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

/**
 * Creates an object by merging together two objects.
 * Recursive, so nested objects get merged too.
 * @param {Object} formsObject Eg {singular: ["dūce"], plural: ["dūcite"]}
 * @param {Object} objectToMerge Eg {singular: ["dūc"]}
 * @returns Eg {singular: ["dūce", "dūc"], plural: ["dūcite"]}
 */
//// This code is horrific but it seems to work.
function mergeTwoObjects(formsObject, objectToMerge) {
	if (!objectToMerge) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside mergeTwoObjects`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		if (!Array.isArray(objectToMerge)) {
			console.warn({
				message: 'formsObject is array but objectToMerge is not',
				formsObject,
				objectToMerge,
			});
		}
		//// Concatenate the two arrays, removing duplicates.
		return [...new Set(formsObject.concat(objectToMerge))];
	}
	//// Take `formsObject` & merge properties with the same key in the two objects.
	const objectWithSamePropertiesMerged = Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.map(([key, obj]) => [key, mergeTwoObjects(obj, objectToMerge[key])])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});

	//// Merge properties in `objectToMerge` that are not in `formsObject`.
	if (
		Object.keys(objectToMerge).find(
			(key) => !objectWithSamePropertiesMerged.hasOwnProperty(key),
		)
	) {
		const withMoreProps = Object.entries(objectToMerge)
			.filter((key, obj) => !objectWithSamePropertiesMerged.hasOwnProperty(key))
			.reduce(
				(accumulated, current) => {
					accumulated[current[0]] = current[1];
					return accumulated;
				},
				{ ...objectWithSamePropertiesMerged },
			);

		const finallyMerged = {
			...withMoreProps,
			...objectWithSamePropertiesMerged,
		};
		return finallyMerged;
	}
	return objectWithSamePropertiesMerged;
}

/**
 * Creates an object by merging together several objects.
 * If only one object is given, that one object is returned.
 * @param {Object[]} objects  Eg [{singular: ["dūce"]}, {singular: ["dūc"]}, {plural: ["dūcite"]}]
 * @returns Eg {singular: ["dūce", "dūc"], plural: ["dūcite"]}
 */
function mergeObjects(objects) {
	if (!objects || !objects.length) {
		console.error('No objects in mergeObjects', objects);
		return {};
	}
	let merged = objects[0];
	for (let i = 1; i < objects.length; i++) {
		merged = mergeTwoObjects(merged, objects[i]);
	}
	return merged;
}

/**
 * Creates an object by merging together two objects.
 * Keys in `replacementObject` override matching keys in `formsObject`.
 * Recursive, so nested objects get merged too.
 * @param {Object} formsObject Eg {singular: ["dūce"], plural: ["dūcite"]}
 * @param {Object} replacementObject Eg {singular: ["dūc"]}
 * @returns Eg {singular: ["dūc"], plural: ["dūcite"]}
 */
function replaceFieldsInObjects(formsObject, replacementObject) {
	if (!replacementObject) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside replaceFieldsInObjects`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		if (!Array.isArray(replacementObject)) {
			console.warn({
				message: 'formsObject is array but replacementObject is not',
				formsObject,
				replacementObject,
			});
		}
		return replacementObject;
	} else if (Array.isArray(replacementObject)) {
		return replacementObject;
	}
	//// Take `formsObject` & merge properties with the same key in the two objects.
	const objectWithSamePropertiesReplaced = Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.map(([key, obj]) => [
			key,
			replaceFieldsInObjects(obj, replacementObject[key]),
		])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});

	//// Merge properties in `replacementObject` that are not in `formsObject`.
	if (
		Object.keys(replacementObject).find(
			(key) => !objectWithSamePropertiesReplaced.hasOwnProperty(key),
		)
	) {
		return Object.entries(replacementObject)
			.filter(
				(key, obj) => !objectWithSamePropertiesReplaced.hasOwnProperty(key),
			)
			.reduce((accumulated, current) => {
				accumulated[current[0]] = current[1];
				return accumulated;
			}, objectWithSamePropertiesReplaced);
	}
	return objectWithSamePropertiesReplaced;
}

/**
 * Relabels "que" forms as "unencliticized" and deletes other forms.
 * Used on lemmata such as plērusque, which is a [1,2]-declension adjective with -que suffixed.
 * @param {Object} formsObject Eg {que: ["plērusque"]}
 * @param {boolean} lemmaHasQueEnding The function only changes the object if this is true.
 * @returns Eg {unencliticized: ["plērusque"]}
 */
function markQueAsUnencliticized(formsObject, lemmaHasQueEnding = false) {
	if (!lemmaHasQueEnding) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(
			`formsObject is ${formsObject} inside markQueAsUnencliticized`,
		);
		return formsObject;
	}
	if (!formsObject.que) {
		console.warn(
			`lemma is marked as having -que ending but no -que forms were generated`,
		);
		return formsObject;
	}
	const newFormsObject = { ...formsObject };
	delete newFormsObject.ne;
	delete newFormsObject.ve;
	delete newFormsObject.unencliticized;
	newFormsObject.unencliticized = newFormsObject.que;
	delete newFormsObject.que;
	return newFormsObject;
}

/**
 * Returns an object that is the parameter but without any values that are false, an empty array [], or an empty object {}.
 * Recursive, so nested objects get deleted too.
 * @param {Object} formsObject
 * @returns
 */
function deleteEmptyFields(formsObject) {
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside deleteUnwantedForms`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject;
	}
	return Object.entries(formsObject)
		.filter(([key, obj]) => obj)
		.map(([key, obj]) => [key, deleteEmptyFields(obj)])
		.filter(([key, obj]) => Object.values(obj).length) // This deletes [] as well as {}.
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

/**
 * Returns `formObject` but with `lambda` run on every form.
 * The `lambda` function can return a string or string array.
 * @param {Object} formsObject Eg {first: ["1ō"], second: ["1ās"], third: ["1at"]}
 * @param {Function} lambda Eg (x => x.replace("1", "am"))
 * @returns Eg {first: ["amō"], second: ["amās"], third: ["amat"]}
 */
function runLambdaOnObject(formsObject, lambda) {
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside runLambdaOnObject`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject.flatMap((form) => lambda(form));
	}
	return Object.entries(formsObject)
		.map(([key, obj]) => [key, runLambdaOnObject(obj, lambda)])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

/**
 * Stringifies each key of each parameter and logs the result.
 * This makes the log more useful than [object Object].
 * @param  {...any} args Eg {positive: ["amīcus"]}
 */
function consoleLogAsJson(...args) {
	if (!Array.isArray(args)) {
		'args is not array: ' + JSON.stringify(args);
	}
	const object = {};
	args.forEach((objectToLog) => {
		Object.entries(objectToLog).forEach(([key, value]) => {
			object[key] = JSON.stringify(value);
		});
	});
	console.log(object);
}

/**
 * Removes acute accents from a string.
 * @param {string} string Eg "Tibérī"
 * @returns Eg "Tiberī"
 */
function removeAcutes(string) {
	// NFD splits characters (eg á => a + \u0301, which is the combining acute accent).
	// NFC merges characters back together.
	return string.normalize('NFD').replaceAll('\u0301', '').normalize('NFC');
}

/**
 * Wraps the parameter in an array if it isn’t an array already.
 * @param {Array | any} possibleArray Eg "amīcus" or ["amīcus"]
 * @returns Eg ["amīcus"]
 */
function ensureIsArray(possibleArray) {
	return Array.isArray(possibleArray) ? possibleArray : [possibleArray];
}

/**
 * Returns an array with all the values of `stems`
 * concatenated with all the values of `endings`.
 * Adds diaereses if needed so that 'Tana' + 'e' => 'Tanaë'
 * but 'Tana' + 'em' => 'Tanaem'.
 * (The velut Word Data Generator interprets final vowel+'m' as nasalised
 * before it interprets 'ae'/'au'/'oe' as a diphthong, which means that
 * non-diphthong 'ae'/'au'/'oe' doesn’t need the diaeresis if it’s before final 'm'.)
 * @param {string | string[]} stems Eg "amāv"
 * @param {string | string[]} endings Eg ["ērunt", "ēre"]
 * @param {boolean} includeSyncopation True to return syncopated forms such as 'amāsse' alongside 'amāvisse'.
 * @returns Eg ["amāvērunt", "amāvēre"] without syncopation, or ["amāvērunt", "amārunt", "amāvēre"] with syncopation
 */
function joinStemsToEndings(stems, endings, includeSyncopation = false) {
	const stemsArray = ensureIsArray(stems);
	const endingsArray = ensureIsArray(endings);

	//// If syncopation is allowed and the stems include -īv and -i,
	//// resulting forms should be like audīvistī, audiistī, audīstī, in that order,
	//// with the audīstī form (created by syncopating audīvistī) coming after audiistī.
	//// I’m calling this “intermediate syncopation”.
	const includeIntermediateSyncopation =
		includeSyncopation &&
		stemsArray.some((s) => s.endsWith('īv')) &&
		stemsArray.some((s) => s.endsWith('i'));

	if (includeIntermediateSyncopation) {
		// Check that the -īv and -i stems to be the same (except for the -īv and -i)
		const stemBeforeI = stemsArray
			.find((s) => s.endsWith('īv'))
			.replace(/īv$/, '');
		const stemWithIv = stemBeforeI + 'īv';
		const stemWithI = stemBeforeI + 'i';
		if (!stemsArray.includes(stemWithI) || !stemsArray.includes(stemWithIv)) {
			console.warn(
				'stemsArray looks weird for intermediate syncopation',
				stemsArray,
			);
		}
	}

	const formsWithoutDeduplication = stemsArray
		.flatMap((stem) => {
			//// In intermediary values here, ~ means the join between a stem and ending without syncopation (eg audīv~istī will produce audīvistī),
			//// and ~~ means the join with syncopation (eg audīv~~istī will produce audīstī).
			return endingsArray.flatMap((ending) => {
				if (includeIntermediateSyncopation) {
					return [
						stem + '~' + ending,
						stem.replace(/īv$/, 'i') + '~' + ending,
						stem + '~~' + ending,
					];
				}
				if (includeSyncopation) {
					return [stem + '~' + ending, stem + '~~' + ending];
				}
				return [stem + '~' + ending];
			});
		})
		.map((stemAndEnding) =>
			stemAndEnding
				.replace(/a~+e(?!m$)/, 'aë')
				.replace(/a~+u(?!m$)/, 'aü')
				.replace(/o~+e(?!m$)/, 'oë')
				// The + in the previous regexes probably isn’t necessary because no perfect stems end in 'a' or 'o'.
				.replace(/āv~~er/, 'ār') // eg amāverō -> amārō
				.replace(/āv~~ēr(?!e)/, 'ār') // eg amāvērunt should syncopate to amārunt but amāvēre should not syncopate to amāre
				.replace(/āv~~is/, 'ās') // eg amāvisse, amāvistī -> amāsse, amāstī
				.replace(/ēv~~er/, 'ēr') // eg complēverō -> complērō
				.replace(/ēv~~ēr(?!e)/, 'ēr') // eg complēvērunt should syncopate to complērunt but complēvēre should not syncopate to complēre
				.replace(/ēv~~is/, 'ēs') // eg complēvisse, complēvistī -> complēsse, complēstī

				// I have not found any attestations of -īver- or -īvēr- contracting to -īr-, except sīrint in Plautus (https://latin.packhum.org/loc/119/4/8/3793-3800).
				// If I find more attestations, I might uncomment the next two lines.
				// .replace(/īv~~er/, 'īr') // eg lacessīverō -> lacessīrō
				// .replace(/īv~~ēr(?!e)/, 'īr') // eg lacessīvērunt would syncopate to lacessīrunt but lacessīvēre would not syncopate to lacessīre
				.replace(/īv~~is/, 'īs') // eg lacessīvisse, lacessīvistī -> lacessīsse, lacessīstī
				.replace(/ōv~~er/, 'ōr') // eg mōverō -> mōrō
				.replace(/ōv~~ēr(?!e)/, 'ōr') // eg mōvērunt should syncopate to mōrunt but mōvēre should not syncopate to mōre
				.replace(/ōv~~is/, 'ōs') // eg mōvisse, mōvistī -> mōsse, mōstī
				.replace(/~+/, ''),
		);
	// Remove any duplicates.
	return [...new Set(formsWithoutDeduplication)];
}

function generateComparativeForms(comparativeStems) {
	return {
		masculine: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'or'),
				vocative: joinStemsToEndings(comparativeStems, 'or'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrem'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				vocative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'or'),
				vocative: joinStemsToEndings(comparativeStems, 'or'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrem'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				vocative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'us'),
				vocative: joinStemsToEndings(comparativeStems, 'us'),
				accusative: joinStemsToEndings(comparativeStems, 'us'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōra'),
				vocative: joinStemsToEndings(comparativeStems, 'ōra'),
				accusative: joinStemsToEndings(comparativeStems, 'ōra'),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
	};
}

function generateSuperlativeForms(superlativeStems) {
	return {
		masculine: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'us'),
				vocative: joinStemsToEndings(superlativeStems, 'e'),
				accusative: joinStemsToEndings(superlativeStems, 'um'),
				genitive: joinStemsToEndings(superlativeStems, 'ī'),
				dative: joinStemsToEndings(superlativeStems, 'ō'),
				ablative: joinStemsToEndings(superlativeStems, 'ō'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'ī'),
				vocative: joinStemsToEndings(superlativeStems, 'ī'),
				accusative: joinStemsToEndings(superlativeStems, 'ōs'),
				genitive: joinStemsToEndings(superlativeStems, 'ōrum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'am'),
				genitive: joinStemsToEndings(superlativeStems, 'ae'),
				dative: joinStemsToEndings(superlativeStems, 'ae'),
				ablative: joinStemsToEndings(superlativeStems, 'ā'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'ae'),
				vocative: joinStemsToEndings(superlativeStems, 'ae'),
				accusative: joinStemsToEndings(superlativeStems, 'ās'),
				genitive: joinStemsToEndings(superlativeStems, 'ārum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'um'),
				vocative: joinStemsToEndings(superlativeStems, 'um'),
				accusative: joinStemsToEndings(superlativeStems, 'um'),
				genitive: joinStemsToEndings(superlativeStems, 'ī'),
				dative: joinStemsToEndings(superlativeStems, 'ō'),
				ablative: joinStemsToEndings(superlativeStems, 'ō'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'a'),
				genitive: joinStemsToEndings(superlativeStems, 'ōrum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
	};
}

// This should receive the `forms` object of intransitive verbs,
// to clear out passive non-impersonal forms.
// It does not mutate the object passed in.
// Does not delete perfect passive participles if told they should exist.
const deleteFormsForIntransitiveVerb = (
	forms,
	{ HasPerfectPassiveParticiple },
) => {
	if (!forms) {
		console.error('Forms is ' + forms);
	}
	const f = structuredClone(forms);
	if (f.indicative?.passive) {
		delete f.indicative.passive.present.singular.first;
		delete f.indicative.passive.present.singular.second;
		delete f.indicative.passive.present.plural;
		delete f.indicative.passive.imperfect.singular.first;
		delete f.indicative.passive.imperfect.singular.second;
		delete f.indicative.passive.imperfect.plural;
		delete f.indicative.passive.future.singular.first;
		delete f.indicative.passive.future.singular.second;
		delete f.indicative.passive.future.plural;
	}
	if (f.subjunctive?.passive) {
		delete f.subjunctive.passive.present.singular.first;
		delete f.subjunctive.passive.present.singular.second;
		delete f.subjunctive.passive.present.plural;
		delete f.subjunctive.passive.imperfect.singular.first;
		delete f.subjunctive.passive.imperfect.singular.second;
		delete f.subjunctive.passive.imperfect.plural;
	}
	if (f.imperative?.passive) {
		delete f.imperative.passive.present.singular.second;
		delete f.imperative.passive.present.plural;
		delete f.imperative.passive.future.singular.second;
		delete f.imperative.passive.future.plural;
	}
	if (f.participle?.passive?.perfect && !HasPerfectPassiveParticiple) {
		delete f.participle.passive.perfect.masculine;
		delete f.participle.passive.perfect.feminine;
		delete f.participle.passive.perfect.neuter.plural;
		delete f.participle.passive.perfect.neuter.singular.vocative;
	}
	if (f.participle?.passive?.future) {
		delete f.participle.passive.future.masculine;
		delete f.participle.passive.future.feminine;
		delete f.participle.passive.future.neuter.plural;
		delete f.participle.passive.future.neuter.singular.vocative;
	}
	if (f.supine) {
		delete f.supine.ablative;
	}
	return f;
};

// This function should be called at the end of each inflection function.
function applyFieldsToForms(
	allUnencliticizedForms,
	rest,
	// Eg ‘hīcine’ may be better than ‘hīcne’
	addIAfterCBeforeEncliticNe = false,
) {
	const withReplacements = replaceFieldsInObjects(
		allUnencliticizedForms,
		rest.ReplacementForms,
	);
	const withExtraForms = mergeTwoObjects(withReplacements, rest.ExtraForms);
	const withEnclitics = multiplyWithEnclitics(
		withExtraForms,
		addIAfterCBeforeEncliticNe,
	);
	const withReplacementEncliticizedForms = replaceFieldsInObjects(
		withEnclitics,
		rest.ReplacementEncliticizedForms,
	);
	const withExtraEncliticizedForms = mergeTwoObjects(
		withReplacementEncliticizedForms,
		rest.ExtraEncliticizedForms,
	);
	const withQueLemmaHandled = markQueAsUnencliticized(
		withExtraEncliticizedForms,
		rest.IsLemmaInQue,
	);
	const wantedForms = deleteUnwantedForms(
		withQueLemmaHandled,
		rest.ParsingsToExclude,
	);
	const withoutEmptyFields = deleteEmptyFields(wantedForms);
	return withoutEmptyFields;
}

////
//// Functions for building the output Json:
////

const inflectFuncs = {
	Adjective: ({ Lemma, PartOfSpeech, ...rest }) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		const lemma = rest.IsLemmaInQue
			? removeBrackets(Lemma).replace(/que$/, '')
			: removeBrackets(Lemma);

		const declensionsString = rest.Declensions
			? JSON.stringify(rest.Declensions)
			: lemma.endsWith('us') ||
			  lemma.endsWith('üs') ||
			  lemma.endsWith('er') ||
			  lemma.endsWith('a') ||
			  lemma.endsWith('ī')
			? '[1,2]'
			: '[3]';

		//// Indeclinable adjectives
		if (declensionsString === '[0]') {
			const forms = {
				positive: {
					masculine: {
						singular: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
						plural: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
					},
					feminine: {
						singular: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
						plural: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
					},
					neuter: {
						singular: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
						plural: {
							nominative: [lemma],
							vocative: [lemma],
							accusative: [lemma],
							genitive: [lemma],
							dative: [lemma],
							ablative: [lemma],
						},
					},
				},
			};
			return applyFieldsToForms(forms, rest);
		}

		//// 1st-declension adjectives (eg rūricola)
		if (declensionsString === '[1]') {
			//// Just a 1st-declension noun replicated across three genders.
			const firstDeclForms = inflectFuncs.Noun({
				Lemma,
				...rest,
			}).unencliticized.feminine;
			const allUnencliticizedForms = {
				positive: {
					masculine: firstDeclForms,
					feminine: firstDeclForms,
					neuter: firstDeclForms,
				},
			};
			return applyFieldsToForms(allUnencliticizedForms, rest);
		}

		//// 1st/2nd-declension adjectives
		if (declensionsString === '[1,2]') {
			if (lemma.match(/[^q][eiu]us$/) && !rest.ParsingsToExclude) {
				console.warn(
					'Please define ParsingsToExclude because adjectives in -eus, -ius, -uus generally don’t have comparative/superlative: ' +
						Lemma,
				);
			}

			const stems = ensureIsArray(
				(() => {
					if (rest.ObliqueStems) {
						return rest.ObliqueStems;
					}
					if (lemma.endsWith('er')) {
						return lemma;
					}
					if (lemma.endsWith('a') | lemma.endsWith('ī')) {
						return lemma.substring(0, lemma.length - 1);
					}
					return lemma.substring(0, lemma.length - 2);
				})(),
			);
			const comparativeStems =
				rest.ComparativeStems || joinStemsToEndings(stems, 'i');
			const superlativeStems =
				rest.SuperlativeStems ||
				(lemma.endsWith('er')
					? joinStemsToEndings(lemma, 'rim')
					: joinStemsToEndings(stems, 'issim'));

			const allUnencliticizedForms = {
				positive: {
					masculine: {
						singular: {
							nominative: [lemma],
							vocative: lemma.endsWith('r') // eg āter, signifer, camur, satur
								? [lemma]
								: joinStemsToEndings(stems, 'e'),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: joinStemsToEndings(stems, 'ī'), // Unlike for nouns, genitives in -iī do not contract.
							dative: joinStemsToEndings(stems, 'ō'),
							ablative: joinStemsToEndings(stems, 'ō'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'ī') : [],
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'ī'),
							vocative: joinStemsToEndings(stems, 'ī'),
							accusative: joinStemsToEndings(stems, 'ōs'),
							genitive: joinStemsToEndings(stems, 'ōrum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'īs') : [],
						},
					},
					feminine: {
						singular: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'am'),
							genitive: joinStemsToEndings(stems, 'ae'),
							dative: joinStemsToEndings(stems, 'ae'),
							ablative: joinStemsToEndings(stems, 'ā'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'ae') : [],
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'ae'),
							vocative: joinStemsToEndings(stems, 'ae'),
							accusative: joinStemsToEndings(stems, 'ās'),
							genitive: joinStemsToEndings(stems, 'ārum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'īs') : [],
						},
					},
					neuter: {
						singular: {
							nominative: joinStemsToEndings(stems, 'um'),
							vocative: joinStemsToEndings(stems, 'um'),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: joinStemsToEndings(stems, 'ī'),
							dative: joinStemsToEndings(stems, 'ō'),
							ablative: joinStemsToEndings(stems, 'ō'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'ī') : [],
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'a'),
							genitive: joinStemsToEndings(stems, 'ōrum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
							locative: rest.HasLocative ? joinStemsToEndings(stems, 'īs') : [],
						},
					},
				},
				comparative: generateComparativeForms(comparativeStems),
				superlative: generateSuperlativeForms(superlativeStems),
			};
			return applyFieldsToForms(allUnencliticizedForms, rest);
		}
		//// 3rd-declension adjectives
		const stems = ensureIsArray(
			(() => {
				if (rest.ObliqueStems) {
					return rest.ObliqueStems;
				}
				if (lemma.endsWith('āns')) {
					return lemma.replace(/āns$/, 'ant');
				}
				if (lemma.endsWith('ēns')) {
					return lemma.replace(/ēns$/, 'ent');
				}
				if (lemma.endsWith('ōns')) {
					return lemma.replace(/ōns$/, 'ont');
				}
				if (lemma.endsWith('r')) {
					return lemma;
				}
				if (lemma.endsWith('as')) {
					return lemma.replace(/as$/, 'ad');
				}
				if (lemma.endsWith('x')) {
					return lemma.replace(/x$/, 'c');
				}
				return lemma.substring(0, lemma.length - 2);
			})(),
		);

		const hasIStem = (() => {
			if (rest.HasIStem === true || rest.HasIStem === false) {
				return rest.HasIStem;
			}
			if (lemma.endsWith('ilis')) {
				return true;
			}
			if (lemma.endsWith('īlis')) {
				return true;
			}
			if (lemma.endsWith('ālis')) {
				return true;
			}
			if (lemma.endsWith('ēlis')) {
				return true;
			}
			if (lemma.endsWith('ūlis')) {
				return true;
			}
			if (lemma.endsWith('ns')) {
				return true;
			}
			if (lemma.endsWith('ēnsis')) {
				return true;
			}
			if (lemma.endsWith('guis')) {
				return true;
			}
			if (lemma.endsWith('quis')) {
				return true;
			}
			if (stems[0].endsWith('r')) {
				return true;
			}
			if (lemma.endsWith('x')) {
				return true;
			}

			//// Let’s assume that Greek adjectives don’t have i-stem.
			//// (I don’t know!)
			if (rest.Transliterations) {
				return false;
			}
			//// Adjectives should have i-stem by default, unlike nouns.
			return true;
		})();

		const hasThreeTerminations = (() => {
			if (
				rest.HasThreeTerminations === true ||
				rest.HasThreeTerminations === false
			) {
				return rest.HasThreeTerminations;
			}
			if (lemma.endsWith('er')) {
				console.log(
					`Please define HasThreeTerminations because ${lemma} ends in -er`,
				);
			}
			return false;
		})();

		const hasOneTermination =
			!hasThreeTerminations &&
			stems.some((stem) => lemma !== stem + 'is' && lemma !== stem + 'ēs');

		const comparativeStems =
			rest.ComparativeStems || joinStemsToEndings(stems, 'i');
		const superlativeStems =
			rest.SuperlativeStems ||
			(lemma.endsWith('er')
				? joinStemsToEndings(lemma, 'rim')
				: joinStemsToEndings(stems, 'issim'));

		// Samnīs, Suffēnās, etc should have abl sing in -ī & -e.
		const isPatrialLikeSamnīs =
			lemma !== lemma.toLowerCase() &&
			(lemma.endsWith('ās') || lemma.endsWith('īs'));

		// IsPresentParticiple is used inside verb conjugations.
		// It can be used on adjective lemmata in the source data, but it shouldn’t be used on an adjective if a corresponding verb would generate a present participle in -ante/-ente.
		// For example, the adjective lemma ‘elegāns’ has IsPresentParticiple=true, because there’s no verb ‘elegō’ that has ‘elegante’ as a participle among its generated forms, and we want ‘elegante’ to be generated, so it’s generated from the adjective.
		const ablativeSingular = joinStemsToEndings(
			stems,
			hasIStem
				? rest.IsPresentParticiple || isPatrialLikeSamnīs
					? ['ī', 'e']
					: 'ī'
				: 'e',
		);

		const allUnencliticizedForms = {
			positive: {
				masculine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: joinStemsToEndings(stems, 'em'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: ablativeSingular,
					},
					plural: {
						nominative: joinStemsToEndings(stems, 'ēs'),
						vocative: joinStemsToEndings(stems, 'ēs'),
						accusative: joinStemsToEndings(
							stems,
							hasIStem ? ['ēs', 'īs'] : 'ēs',
						),
						genitive: joinStemsToEndings(stems, hasIStem ? 'ium' : 'um'),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
				feminine: {
					singular: {
						nominative: hasThreeTerminations
							? joinStemsToEndings(stems, 'is')
							: [lemma],
						vocative: hasThreeTerminations
							? joinStemsToEndings(stems, 'is')
							: [lemma],
						accusative: joinStemsToEndings(stems, 'em'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: ablativeSingular,
					},
					plural: {
						nominative: joinStemsToEndings(stems, 'ēs'),
						vocative: joinStemsToEndings(stems, 'ēs'),
						accusative: joinStemsToEndings(
							stems,
							hasIStem ? ['ēs', 'īs'] : 'ēs',
						),
						genitive: joinStemsToEndings(stems, hasIStem ? 'ium' : 'um'),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
				neuter: {
					singular: {
						nominative: hasOneTermination
							? [lemma]
							: joinStemsToEndings(stems, 'e'),
						vocative: hasOneTermination
							? [lemma]
							: joinStemsToEndings(stems, 'e'),
						accusative: hasOneTermination
							? [lemma]
							: joinStemsToEndings(stems, 'e'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: ablativeSingular,
					},
					plural: {
						nominative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
						vocative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
						accusative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
						genitive: joinStemsToEndings(stems, hasIStem ? 'ium' : 'um'),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
			},
			comparative: generateComparativeForms(comparativeStems),
			superlative: generateSuperlativeForms(superlativeStems),
		};
		return applyFieldsToForms(allUnencliticizedForms, rest);
	},
	Conjunction: ({ Lemma, PartOfSpeech, ...rest }) => {
		if (Lemma.startsWith('-')) {
			return rest.Forms;
		}
		// Forms should include the lemma plus forms in any “Forms” field.
		const lemma = removeBrackets(Lemma);
		const basicForms = [lemma];
		if (rest.Forms) {
			basicForms.push(...rest.Forms);
		}
		const uniqueBasicForms = [...new Set(basicForms)];
		// applyFieldsToForms adds enclitics and handles other fields in the lemma object.
		const allForms = applyFieldsToForms(uniqueBasicForms, rest);
		if (rest.ReceivesEnclitics) {
			return allForms;
		}
		// If encliticized forms shouldn’t actually be given, we remove them.
		return deleteUnwantedForms(allForms, ['ne', 'que', 've']);
	},
	Adverb: ({ Lemma, PartOfSpeech, ...rest }) => {
		if (rest.Forms) {
			return applyFieldsToForms(rest.Forms, rest, true);
		}
		const positive = removeBrackets(Lemma);
		const stems = rest.ObliqueStems || [
			positive.replace(/(ē|iter|(?<=c)ter|er|im|om|um|ō|e|ī)$/, ''),
		];

		if (
			rest.IsIndeclinable ||
			positive === stems[0] ||
			(!rest.ObliqueStems &&
				(positive.endsWith('ātim') || positive.endsWith('ūtim')))
		) {
			if (rest.IsIndeclinable) {
				// For adverbs, `IsIndeclinable: true` is a less correct property than `ParsingsToExclude: ["comparative", "superlative"]`
				// although the two properties are treated the same.
				console.warn(`Adverb marked as indeclinable: ${Lemma}`);
			}
			return applyFieldsToForms({ positive: [positive] }, rest, true);
		}

		// The data fields ComparativeStems and SuperlativeStems aren’t especially
		// helpful for adverbs, since ReplacementForms can easily be used instead.
		// The following two lines are equivalent:
		// ComparativeStems: ['meli']);
		// ReplacementForms: { comparative: ['melius'] };
		// But I include handling for ComparativeStems and SuperlativeStems here for consistency with adjectives.

		const comparativeStems = rest.ComparativeStems ?? stems.map((s) => s + 'i');
		const comparatives = comparativeStems.map((s) => s + 'us');

		const superlativeStems =
			rest.SuperlativeStems ??
			stems.map((s) =>
				/[bcdefghpt]r$/.test(s) ? s.replace(/e?r$/, 'errim') : s + 'issim',
			);
		const superlatives = superlativeStems.map((s) => s + 'ē');

		const allForms = {
			positive: [positive],
			comparative: comparatives,
			superlative: superlatives,
		};
		return applyFieldsToForms(allForms, rest, true);
	},
	Interjection: ({ Lemma, PartOfSpeech, ...rest }) => {
		const forms = rest.Forms ?? [removeBrackets(Lemma)];
		const withFields = applyFieldsToForms(forms, rest);
		return deleteUnwantedForms(withFields, ['ne', 'que', 've']);
	},
	Noun: ({ Lemma, PartOfSpeech, ...rest }) => {
		const lemma = removeBrackets(Lemma);
		const declensions = (() => {
			if (rest.Declensions) {
				return rest.Declensions;
			}
			if (Lemma.endsWith('ōrum]')) {
				console.log(`Assuming 2nd declension for ${Lemma}`);
				return [2];
			}
			if (lemma.endsWith('a')) {
				console.log(`Assuming 1st declension for ${Lemma}`);
				return [1];
			}
			if (lemma.endsWith('ē')) {
				console.log(`Assuming 1st declension for ${Lemma}`);
				return [1];
			}
			if (lemma.endsWith('ae')) {
				console.log(`Assuming 1st declension for ${Lemma}`);
				return [1];
			}
			if (
				lemma.endsWith('us') ||
				lemma.endsWith('üs') ||
				lemma.endsWith('er') ||
				lemma.endsWith('um') ||
				lemma.endsWith('os') ||
				lemma.endsWith('ī')
			) {
				// console.log('Assuming 2nd declension for ' + Lemma);
				return [2];
			}
			if (lemma.endsWith('ū')) {
				console.log('Assuming 4th declension for ' + Lemma);
				return [4];
			}
			return [3];
		})();
		const genders = (() => {
			if (rest.Genders) {
				return rest.Genders;
			}

			console.log('Genders not specified for ' + Lemma);

			if (rest.Notes) {
				if (
					rest.Notes.includes('masculine') &&
					rest.Notes.includes('feminine') &&
					rest.Notes.includes('neuter')
				) {
					console.log(
						`Assuming masculine & feminine & neuter for ${Lemma}: ${rest.Notes}`,
					);
					return ['masculine', 'feminine', 'neuter'];
				}
				if (
					rest.Notes.includes('masculine') &&
					rest.Notes.includes('feminine')
				) {
					console.log(
						`Assuming masculine & feminine for ${Lemma}: ${rest.Notes}`,
					);
					return ['masculine', 'feminine'];
				}
				if (rest.Notes.includes('masculine') && rest.Notes.includes('neuter')) {
					console.log(
						`Assuming masculine & neuter for ${Lemma}: ${rest.Notes}`,
					);
					return ['masculine', 'neuter'];
				}
				if (rest.Notes.includes('masculine')) {
					console.log(`Assuming masculine for ${Lemma}: ${rest.Notes}`);
					return ['masculine'];
				}
				if (rest.Notes.includes('feminine')) {
					console.log(`Assuming feminine for ${Lemma}: ${rest.Notes}`);
					return ['feminine'];
				}
				if (rest.Notes.includes('neuter')) {
					console.log(`Assuming neuter for ${Lemma}: ${rest.Notes}`);
					return ['neuter'];
				}
			}

			if (declensions.includes(1)) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (declensions.includes(2)) {
				if (lemma.endsWith('um') || lemma.endsWith('on')) {
					console.log(`Assuming neuter for ${Lemma}`);
					return ['neuter'];
				}
				console.log(`Assuming masculine for ${Lemma}`);
				return ['masculine'];
			}
			if (lemma.endsWith('ōn')) {
				console.log(`Assuming masculine for ${Lemma}`);
				return ['masculine'];
			}
			if (lemma.endsWith('on')) {
				console.log(`Assuming neuter for ${Lemma}`);
				return ['neuter'];
			}
			if (lemma.endsWith('ē')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('iō')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('tūdō')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('ās')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('ae')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('or')) {
				console.log(`Assuming masculine for ${Lemma}`);
				return ['masculine'];
			}
			if (lemma.endsWith('x')) {
				console.log(`Assuming feminine for ${Lemma}`);
				return ['feminine'];
			}
			if (lemma.endsWith('l')) {
				console.log(`Assuming neuter for ${Lemma}`);
				return ['neuter'];
			}
			if (lemma.endsWith('le')) {
				console.log(`Assuming neuter for ${Lemma}`);
				return ['neuter'];
			}
			if (lemma.endsWith('os')) {
				console.log(`Assuming masculine for ${Lemma}`);
				return ['masculine'];
			}
			if (lemma.endsWith('ōs')) {
				console.log(`Assuming masculine for ${Lemma}`);
				return ['masculine'];
			}
			if (lemma.endsWith('ar')) {
				console.log(`Assuming neuter for ${Lemma}`);
				return ['neuter'];
			}
			console.warn(`Could not determine genders for ${Lemma}`);
			return [];
		})();

		if (rest.Forms) {
			return applyFieldsToForms(rest.Forms, rest);
		}

		let forms = {};
		const hasLocativePlural =
			rest.HasLocative && rest.ParsingsToExclude?.includes('singular');
		const hasLocativeSingular = rest.HasLocative && !hasLocativePlural;

		if (declensions.includes(0)) {
			genders.forEach((gender) => {
				forms[gender] = {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
						locative: hasLocativeSingular ? [lemma] : [],
					},
				};
			});
		}

		const assumedStem = (() => {
			function getAssumedStem(tuples) {
				for (let tuple of tuples) {
					const [regex, ending] = tuple;
					if (regex.test(lemma)) {
						return lemma.replace(regex, ending);
					}
				}
				return lemma;
			}

			const thirdDeclLemmaSuffixesAndOblique = [
				[/al$/, 'āl'],
				[/ar$/, 'ār'],
				[/āns$/, 'ant'],
				[/as$/, 'ad'],
				[/ās$/, 'āt'],
				[/(?<=[bp])s$/, ''],
				[/e$/, ''],
				[/en$/, 'in'],
				[/ēns$/, 'ent'],
				[/(?<!a)es$/, 'it'],
				[/ēs$/, ''],
				[/(?<!a)ex$/, 'ic'],
				[/x$/, 'c'],
				[/ia$/, ''],
				[/a$/, ''],
				[/īgō$/, 'īgin'],
				[/is$/, ''],
				[/ēdō$/, 'ēdin'],
				[/tūdō$/, 'tūdin'],
				[/ō$/, 'ōn'],
				[/ōn$/, 'on'],
				[/ōns$/, 'ont'],
				[/or$/, 'ōr'],
				[/ōs$/, 'ōt'],
				[/ys$/, 'y'],
			];
			const nonThirdDeclLemmaSuffixesAndOblique = [
				[/a$/, ''],
				[/ae$/, ''],
				[/ās$/, ''],
				[/ē$/, ''],
				[/ēs$/, ''],
				[/ī$/, ''],
				[/ō$/, ''],
				[/on$/, ''],
				[/os$/, ''],
				[/um$/, ''],
				[/us$/, ''],
				[/üs$/, ''],
				[/ū$/, ''],
				[/ūs$/, ''],
			];

			if (rest.IsGreekThirdDeclensionInOmega) {
				return lemma.replace(/ō$/, '');
			}
			if (declensions.includes(3)) {
				return getAssumedStem(thirdDeclLemmaSuffixesAndOblique);
			} else {
				return getAssumedStem(nonThirdDeclLemmaSuffixesAndOblique);
			}
		})();

		const stems = rest.ObliqueStems ?? [assumedStem];

		const hasIStem = (() => {
			if (rest.HasIStem === true || rest.HasIStem === false) {
				return rest.HasIStem;
			}
			if (!declensions.includes(3)) {
				return false;
			}
			if (rest.ObliqueStems) {
				return false;
			}
			if (lemma.endsWith('ēnsis')) {
				return true;
			}
			if (lemma.endsWith('ns')) {
				return true;
			}
			if (lemma.endsWith('ia')) {
				return true;
			}
			if (lemma.endsWith('is')) {
				return true;
			}
			if (lemma.endsWith('al')) {
				return true;
			}
			if (lemma.endsWith('ar')) {
				return true;
			}
			if (lemma.endsWith('e')) {
				return true;
			}

			//// Parisyllabic nouns probably have i-stem, but this should be confirmed.
			//// Pluralia tantum cannot be deemed parisyllabic because there’s no nominative singular.
			//// Singularia tantum have no plural forms that could be affected by the i-stem.
			const hasBothSingularAndPlural =
				!rest.ParsingsToExclude?.includes('singular') &&
				!rest.ParsingsToExclude?.includes('plural');

			const isParisyllabic =
				hasBothSingularAndPlural &&
				stems.some((stem) => {
					return lemma === stem + 'is' || lemma === stem + 'ēs';
				});

			if (isParisyllabic) {
				console.warn('Assuming HasIStem === true for ' + Lemma);
				return true;
			}

			return false;
		})();

		function getThirdDeclensionNonNeuterForms() {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, 'ī'),
					ablative: joinStemsToEndings(
						stems,
						rest.IsDeclinedLikeAdjective ? 'ī' : 'e',
					),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: joinStemsToEndings(stems, hasIStem ? ['ēs', 'īs'] : 'ēs'),
					genitive: joinStemsToEndings(
						stems,
						hasIStem || rest.IsDeclinedLikeAdjective ? 'ium' : 'um',
					),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : [],
				},
			};
		}
		function getThirdDeclensionNeuterForms() {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, 'ī'),
					ablative: joinStemsToEndings(stems, hasIStem ? 'ī' : 'e'),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
					vocative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
					accusative: joinStemsToEndings(stems, hasIStem ? 'ia' : 'a'),
					genitive: joinStemsToEndings(stems, hasIStem ? 'ium' : 'um'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : [],
				},
			};
		}
		function getFirstDeclensionNonNeuterForms() {
			const isGreekFirstDeclension = (() => {
				if (
					rest.IsGreekFirstDeclension === true ||
					rest.IsGreekFirstDeclension === false
				) {
					return rest.IsGreekFirstDeclension;
				}
				return lemma.endsWith('ās') || lemma.endsWith('ē');
			})();
			const isGreekFirstDeclensionA =
				isGreekFirstDeclension && lemma.endsWith('ās');
			const isGreekFirstDeclensionE =
				isGreekFirstDeclension && !lemma.endsWith('ās');
			const accSingEnding = isGreekFirstDeclensionE
				? 'ēn'
				: isGreekFirstDeclensionA
				? 'ān'
				: 'am';
			const genSingEnding = isGreekFirstDeclensionE ? 'ēs' : 'ae';
			const ablSingEnding = isGreekFirstDeclensionE ? 'ē' : 'ā';
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, accSingEnding),
					genitive: joinStemsToEndings(stems, genSingEnding),
					dative: joinStemsToEndings(stems, 'ae'),
					ablative: joinStemsToEndings(stems, ablSingEnding),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ae') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ae'),
					vocative: joinStemsToEndings(stems, 'ae'),
					accusative: joinStemsToEndings(stems, 'ās'),
					genitive: joinStemsToEndings(stems, 'ārum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'īs') : [],
				},
			};
		}
		function getSecondDeclensionNonNeuterForms() {
			//// Note on vocatives for -ius nouns:
			//// Proper nouns that end in -ius (& fīlius, genius) should have vocative masculine singular in -ī.
			//// (Exceptions include some Greek names that have vocative masculine singular in iota epsilon in Greek.)
			//// Adjectives, and all other nouns, should have vocative masculine singular in -ie.
			//// (However, before imperial times, -ie forms were avoided, and sometimes -ī forms were used instead.)
			//// Source: https://ore.exeter.ac.uk/repository/bitstream/handle/10036/65307/DickeyOEgregie.pdf
			const nonProperNounVocSings =
				lemma.endsWith('er') || lemma.endsWith('ir')
					? [lemma]
					: joinStemsToEndings(stems, 'e');
			const vocSings =
				PartOfSpeech === 'Proper noun'
					? nonProperNounVocSings.map((form) => form.replace(/[iï]e$/, 'ī'))
					: nonProperNounVocSings;

			const regularGenSings = joinStemsToEndings(stems, 'ī');
			const genSings = regularGenSings.flatMap((form) => {
				if (form.endsWith('iī') || form.endsWith('ïī')) {
					return [form, form.replace(/[iï]ī$/, 'ī')];
				}
				return [form];
			});

			return {
				singular: {
					nominative: [lemma],
					vocative: vocSings,
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: genSings,
					dative: joinStemsToEndings(stems, 'ō'),
					ablative: joinStemsToEndings(stems, 'ō'),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ī'),
					vocative: joinStemsToEndings(stems, 'ī'),
					accusative: joinStemsToEndings(stems, 'ōs'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'īs') : [],
				},
			};
		}
		function getSecondDeclensionNeuterForms() {
			const regularGenSings = joinStemsToEndings(stems, 'ī');
			const genSings = regularGenSings.flatMap((form) => {
				if (form.endsWith('iī')) {
					return [form, form.replace(/iī$/, 'ī')];
				}
				return [form];
			});
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: genSings,
					dative: joinStemsToEndings(stems, 'ō'),
					ablative: joinStemsToEndings(stems, 'ō'),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'a'),
					vocative: joinStemsToEndings(stems, 'a'),
					accusative: joinStemsToEndings(stems, 'a'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'īs') : [],
				},
			};
		}
		function getFourthDeclensionNonNeuterForms() {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: joinStemsToEndings(stems, 'ūs'),
					dative: joinStemsToEndings(stems, 'uī'),
					ablative: joinStemsToEndings(stems, 'ū'),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'uī') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ūs'),
					vocative: joinStemsToEndings(stems, 'ūs'),
					accusative: joinStemsToEndings(stems, 'ūs'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : [],
				},
			};
		}
		function getFourthDeclensionNeuterForms() {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: joinStemsToEndings(stems, 'ūs'),
					dative: joinStemsToEndings(stems, 'ū'),
					ablative: joinStemsToEndings(stems, 'ū'),
					locative: hasLocativeSingular ? joinStemsToEndings(stems, 'ū') : [],
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ua'),
					vocative: joinStemsToEndings(stems, 'ua'),
					accusative: joinStemsToEndings(stems, 'ua'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : [],
				},
			};
		}
		function getFourthDeclensionGreekForms() {
			// Eg Clīō, Ēchō, Sapphō
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: joinStemsToEndings(stems, 'ūs'),
					dative: [lemma],
					ablative: [lemma],
				},
			};
		}
		function getFifthDeclensionNonNeuterForms() {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'ēī'),
					dative: joinStemsToEndings(stems, 'ēī'),
					ablative: joinStemsToEndings(stems, 'ē'),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: joinStemsToEndings(stems, 'ēs'),
					genitive: joinStemsToEndings(stems, 'ērum'),
					dative: joinStemsToEndings(stems, 'ēbus'),
					ablative: joinStemsToEndings(stems, 'ēbus'),
				},
			};
		}

		if (declensions.includes(3) && !rest.IsGreekThirdDeclensionInOmega) {
			const thirdDeclForms = {};
			['masculine', 'feminine'].map((gender) => {
				if (genders.includes(gender)) {
					thirdDeclForms[gender] = getThirdDeclensionNonNeuterForms();
				}
			});
			['neuter'].map((gender) => {
				if (genders.includes(gender)) {
					thirdDeclForms[gender] = getThirdDeclensionNeuterForms();
				}
			});
			forms = mergeTwoObjects(forms, thirdDeclForms);
		}
		if (declensions.includes(1)) {
			const firstDeclForms = {};
			['masculine', 'feminine'].map((gender) => {
				if (genders.includes(gender)) {
					firstDeclForms[gender] = getFirstDeclensionNonNeuterForms();
				}
			});
			['neuter'].map((gender) => {
				if (genders.includes(gender)) {
					console.warn(
						'I don’t know how to handle this 1st-declension neuter noun: ' +
							Lemma,
					);
				}
			});
			forms = mergeTwoObjects(forms, firstDeclForms);
		}
		if (declensions.includes(2)) {
			const secondDeclForms = {};
			['masculine', 'feminine'].map((gender) => {
				if (genders.includes(gender)) {
					secondDeclForms[gender] = getSecondDeclensionNonNeuterForms();
				}
			});
			['neuter'].map((gender) => {
				if (genders.includes(gender)) {
					secondDeclForms[gender] = getSecondDeclensionNeuterForms();
				}
			});
			forms = mergeTwoObjects(forms, secondDeclForms);
		}
		if (declensions.includes(4)) {
			const fourthDeclForms = {};
			['masculine', 'feminine'].map((gender) => {
				if (genders.includes(gender)) {
					fourthDeclForms[gender] = getFourthDeclensionNonNeuterForms();
				}
			});
			['neuter'].map((gender) => {
				if (genders.includes(gender)) {
					fourthDeclForms[gender] = getFourthDeclensionNeuterForms();
				}
			});
			forms = mergeTwoObjects(forms, fourthDeclForms);
		}
		if (declensions.includes(3) && rest.IsGreekThirdDeclensionInOmega) {
			const fourthDeclForms = {};
			if (genders.length === 1 && genders.includes('feminine')) {
				fourthDeclForms.feminine = getFourthDeclensionGreekForms();
				forms = mergeTwoObjects(forms, fourthDeclForms);
			} else {
				console.warn(
					`Don’t know how to handle a Greek third-declension noun that’s not feminine-only: ${Lemma} ${genders}`,
				);
			}
		}
		if (declensions.includes(5)) {
			const fifthDeclForms = {};
			['masculine', 'feminine'].map((gender) => {
				if (genders.includes(gender)) {
					fifthDeclForms[gender] = getFifthDeclensionNonNeuterForms();
				}
			});
			['neuter'].map((gender) => {
				if (genders.includes(gender)) {
					console.warn(
						'I don’t know how to handle this 5th-declension neuter noun: ' +
							Lemma,
					);
				}
			});
			forms = mergeTwoObjects(forms, fifthDeclForms);
		}

		if (JSON.stringify(forms) === '{}') {
			console.warn('No forms for ' + Lemma);
			return {};
		}

		return applyFieldsToForms(forms, rest);
	},
	Preposition: ({ Lemma, PartOfSpeech, ...rest }) => {
		if (rest.Forms && Array.isArray(rest.Forms)) {
			return multiplyWithEnclitics([
				...new Set([removeBrackets(Lemma), ...rest.Forms]),
			]);
		}
		if (rest.Forms) {
			return applyFieldsToForms(rest.Forms, rest);
		}
		return applyFieldsToForms([removeBrackets(Lemma)], rest);
	},
	Pronoun: ({ Lemma, PartOfSpeech, ...rest }) => {
		// Pronouns are hardcoded, so there’s not much for the Inflector to do.
		const lemma = removeBrackets(Lemma);
		if (!rest.Forms) {
			console.warn(`Forms not defined for pronoun ${Lemma}`);
			return multiplyWithEnclitics({ lemma: [lemma] });
		}
		const wantedForms = deleteUnwantedForms(rest.Forms, rest.ParsingsToExclude);
		if (
			!wantedForms.unencliticized &&
			(lemma.endsWith('libet') ||
				lemma.endsWith('met') ||
				lemma.endsWith('nam') ||
				lemma.endsWith('piam') ||
				lemma.endsWith('que') ||
				lemma.endsWith('vīs'))
		) {
			console.warn(`Enclitics have not been disabled for ${lemma}`);
		}
		const multiplied = multiplyWithEnclitics(wantedForms, true);
		return applyFieldsToForms(multiplied, rest);
	},
	'Proper noun': ({ Lemma, PartOfSpeech, ...rest }) => {
		//// Proper nouns referring to a town or small(ish) island should have a locative form.
		if (
			!rest.HasLocative &&
			rest.HasLocative !== false &&
			/city|town|village|seaport|\bport\b|(?<!whose )capital|(?<!large )island\b|isle/i.test(
				rest.Meanings,
			)
		) {
			// console.log("Perhaps a locative should be given for " + Lemma + ": " + rest.Meanings);
			console.log('Perhaps a locative should be given for ' + Lemma);
		}

		//// Proper nouns are declined much the same as other nouns.
		//// (They differ in their vocative singular if they end in “-ius”,
		//// but this is handled inside the Noun function.)
		return inflectFuncs['Noun']({ Lemma, PartOfSpeech, ...rest });
	},
	Verb: ({ Lemma, PartOfSpeech, ...rest }) => {
		const lemma = removeBrackets(Lemma);

		let forms = {};

		if (rest.Forms) {
			forms = rest.Forms;
		} else {
			if (!rest.Conjugations || !rest.Conjugations.length) {
				console.warn('No Conjugations given for ' + Lemma);
			}

			const isDeponent = lemma.endsWith('or');

			if (rest.Conjugations?.includes('sum')) {
				const prefix = lemma.replace(/sum$/, '');
				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['sum'],
									second: ['es'],
									third: ['est'],
								},
								plural: {
									first: ['sumus'],
									second: ['estis'],
									third: ['sunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['eram'],
									second: ['erās'],
									third: ['erat'],
								},
								plural: {
									first: ['erāmus'],
									second: ['erātis'],
									third: ['erant'],
								},
							},
							future: {
								singular: {
									first: ['erō'],
									second: ['eris'],
									third: ['erit'],
								},
								plural: {
									first: ['erimus'],
									second: ['eritis'],
									third: ['erunt'],
								},
							},
							perfect: {
								singular: {
									first: ['fuī'],
									second: ['fuistī'],
									third: ['fuit'],
								},
								plural: {
									first: ['fuimus'],
									second: ['fuistis'],
									third: ['fuērunt', 'fuēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['fueram'],
									second: ['fuerās'],
									third: ['fuerat'],
								},
								plural: {
									first: ['fuerāmus'],
									second: ['fuerātis'],
									third: ['fuerant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['fuerō'],
									second: ['fueris'],
									third: ['fuerit'],
								},
								plural: {
									first: ['fuerimus'],
									second: ['fueritis'],
									third: ['fuerint'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['sim'],
									second: ['sīs'],
									third: ['sit'],
								},
								plural: {
									first: ['sīmus'],
									second: ['sītis'],
									third: ['sint'],
								},
							},
							imperfect: {
								singular: {
									first: ['essem', 'forem'],
									second: ['essēs', 'forēs'],
									third: ['esset', 'foret'],
								},
								plural: {
									first: ['essēmus', 'forēmus'],
									second: ['essētis', 'forētis'],
									third: ['essent', 'forent'],
								},
							},
							perfect: {
								singular: {
									first: ['fuerim'],
									second: ['fuerīs'],
									third: ['fuerit'],
								},
								plural: {
									first: ['fuerīmus'],
									second: ['fuerītis'],
									third: ['fuerint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['fuissem'],
									second: ['fuissēs'],
									third: ['fuisset'],
								},
								plural: {
									first: ['fuissēmus'],
									second: ['fuissētis'],
									third: ['fuissent'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['es'],
								},
								plural: {
									second: ['este'],
								},
							},
							future: {
								singular: {
									second: ['estō'],
									third: ['estō'],
								},
								plural: {
									second: ['estōte'],
									third: ['suntō'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['esse'],
							perfect: ['fuisse'],
							future: ['fore'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: 'sēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: 'futūrus' })
								.unencliticized.positive,
						},
					},
				};

				// Attach the prefix to all the forms of ‘sum’.
				forms = runLambdaOnObject(forms, (form) =>
					joinStemsToEndings(prefix, form)
						// Forms such as ‘posfore’ & ‘posfutūrum’ should not exist.
						.filter(
							(form) =>
								!form.includes('posfor') &&
								!form.includes('posfut') &&
								!form.includes('obfor'),
						)
						// Some prefixes change depending on the next letter.
						.map((form) =>
							form
								.replace(/^abf(?=ut|or)/, 'āf') // ‘āfutūrus’ & ‘āfore’ are good; ‘abfutūrus’ & ‘abfore’ are not.
								.replace(/^īn(?![fs])/, 'in')
								.replace(/^dēe/, 'dee')
								.replace(/^poss(?=ēns|ent)/, 'pot')
								.replace(/^posess/, 'poss')
								.replace(/^pose/, 'pote')
								.replace(/^posfu/, 'potu')
								.replace(/^prōe/, 'prōde'),
						)
						// Both ‘āfore’ & ‘abfore’ are good, and likewise ‘āfuī’ & ‘abfuī’.
						// We have already created ‘āfutūrus’ & ‘āfore’.
						.flatMap((form) =>
							form.startsWith('abf')
								? [form.replace(/^abf/, 'āf'), form]
								: form,
						)
						// Both ‘adfuī’ & ‘affuī’ are good, and likewise ‘adfutūtus’ & ‘affutūrus’.
						.flatMap((form) =>
							form.startsWith('adf')
								? [form, form.replace(/^adf/, 'aff')]
								: form,
						)
						// Both ‘obfuī’ & ‘offuī’ are good, and likewise ‘obfutūtus’ & ‘offutūrus’.
						.flatMap((form) =>
							form.startsWith('obf')
								? [form, form.replace(/^obf/, 'off')]
								: form,
						),
				);
			} else if (rest.Conjugations?.includes('ferō')) {
				const prefix = lemma.replace(/fer(ō|or|t)$/, '');
				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['ferō'],
									second: ['fers'],
									third: ['fert'],
								},
								plural: {
									first: ['ferimus'],
									second: ['fertis'],
									third: ['ferunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['ferēbam'],
									second: ['ferēbās'],
									third: ['ferēbat'],
								},
								plural: {
									first: ['ferēbāmus'],
									second: ['ferēbātis'],
									third: ['ferēbant'],
								},
							},
							future: {
								singular: {
									first: ['feram'],
									second: ['ferēs'],
									third: ['feret'],
								},
								plural: {
									first: ['ferēmus'],
									second: ['ferētis'],
									third: ['ferent'],
								},
							},
							perfect: {
								singular: {
									first: ['tulī'],
									second: ['tulistī'],
									third: ['tulit'],
								},
								plural: {
									first: ['tulimus'],
									second: ['tulistis'],
									third: ['tulērunt', 'tulēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['tuleram'],
									second: ['tulerās'],
									third: ['tulerat'],
								},
								plural: {
									first: ['tulerāmus'],
									second: ['tulerātis'],
									third: ['tulerant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['tulerō'],
									second: ['tuleris'],
									third: ['tulerit'],
								},
								plural: {
									first: ['tulerimus'],
									second: ['tuleritis'],
									third: ['tulerint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['feror'],
									second: ['ferris', 'ferre'],
									third: ['fertur'],
								},
								plural: {
									first: ['ferimur'],
									second: ['feriminī'],
									third: ['feruntur'],
								},
							},
							imperfect: {
								singular: {
									first: ['ferēbar'],
									second: ['ferēbāris', 'ferēbāre'],
									third: ['ferēbātur'],
								},
								plural: {
									first: ['ferēbāmur'],
									second: ['ferēbāminī'],
									third: ['ferēbantur'],
								},
							},
							future: {
								singular: {
									first: ['ferar'],
									second: ['ferēris', 'ferēre'],
									third: ['ferētur'],
								},
								plural: {
									first: ['ferēmur'],
									second: ['ferēminī'],
									third: ['ferentur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['feram'],
									second: ['ferās'],
									third: ['ferat'],
								},
								plural: {
									first: ['ferāmus'],
									second: ['ferātis'],
									third: ['ferant'],
								},
							},
							imperfect: {
								singular: {
									first: ['ferrem'],
									second: ['ferrēs'],
									third: ['ferret'],
								},
								plural: {
									first: ['ferrēmus'],
									second: ['ferrētis'],
									third: ['ferrent'],
								},
							},
							perfect: {
								singular: {
									first: ['tulerim'],
									second: ['tulerīs'],
									third: ['tulerit'],
								},
								plural: {
									first: ['tulerīmus'],
									second: ['tulerītis'],
									third: ['tulerint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['tulissem'],
									second: ['tulissēs'],
									third: ['tulisset'],
								},
								plural: {
									first: ['tulissēmus'],
									second: ['tulissētis'],
									third: ['tulissent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['ferar'],
									second: ['ferāris', 'ferāre'],
									third: ['ferātur'],
								},
								plural: {
									first: ['ferāmur'],
									second: ['ferāminī'],
									third: ['ferantur'],
								},
							},
							imperfect: {
								singular: {
									first: ['ferrer'],
									second: ['ferrēris', 'ferrēre'],
									third: ['ferrētur'],
								},
								plural: {
									first: ['ferrēmur'],
									second: ['ferrēminī'],
									third: ['ferrentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['fer'],
								},
								plural: {
									second: ['ferte'],
								},
							},
							future: {
								singular: {
									second: ['fertō'],
									third: ['fertō'],
								},
								plural: {
									second: ['fertōte'],
									third: ['feruntō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['ferre'],
								},
								plural: {
									second: ['feriminī'],
								},
							},
							future: {
								singular: {
									second: ['fertor'],
									third: ['fertor'],
								},
								plural: {
									third: ['feruntor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['ferre'],
							perfect: ['tulisse'],
						},
						passive: {
							present: ['ferrī', 'ferrier'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: 'ferēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: 'lātūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: 'lātus' })
								.unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: 'ferendus' })
								.unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: 'ferendus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['lātum'],
						ablative: ['lātū'],
					},
				};

				// Attach the prefix to all the forms of ferō.
				forms = runLambdaOnObject(forms, (form) =>
					joinStemsToEndings(prefix, form)
						// Some prefixes change depending on the next letter.
						.map((form) =>
							form
								.replace(/^af(?=[l])/, 'al')
								.replace(/^af(?=[t])/, 'at')
								.replace(/^au(?=[l])/, 'ab')
								.replace(/^au(?=[t])/, 'abs')
								.replace(/^cōn(?=[lt])/, 'con')
								.replace(/^dif(?=[l])/, 'dī')
								.replace(/^dif(?=[t])/, 'dis')
								.replace(/^dis(?=[l])/, 'dī')
								.replace(/^ef(?=[l])/, 'ē')
								.replace(/^ef(?=[t])/, 'ex')
								.replace(/^īn(?=[lt])/, 'in')
								.replace(/^suf(?=[t])/, 'sus')
								.replace(/^of(?=[lt])/, 'ob')
								.replace(/^suf(?=[l])/, 'sub')
								.replace(/^suf(?=[t])/, 'sus'),
						)
						// // Both ‘trālātus’ & ‘trānslātus’ etc are permissible.
						.flatMap((form) =>
							form.startsWith('trānsl')
								? [form, form.replace(/^trānsl/, 'trāl')]
								: form,
						)
						.flatMap((form) =>
							form.startsWith('conl')
								? [form, form.replace(/^con/, 'col')]
								: form,
						)
						// rettulī etc are more frequent than retulī but both are permissible.
						.flatMap((form) =>
							form.startsWith('ret')
								? [form.replace(/^ret/, 'rett'), form]
								: form,
						)
						.flatMap((form) =>
							form.startsWith('tul')
								? [form, form.replace(/^tul/, 'tetul')]
								: form,
						),
				);
			} else if (rest.Conjugations?.includes('eō')) {
				const prefix = lemma.replace(/[eë]ō$/, '');
				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['eō'],
									second: ['īs'],
									third: ['it'],
								},
								plural: {
									first: ['īmus'],
									second: ['ītis'],
									third: ['eunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['ībam'],
									second: ['ībās'],
									third: ['ībat'],
								},
								plural: {
									first: ['ībāmus'],
									second: ['ībātis'],
									third: ['ībant'],
								},
							},
							future: {
								singular: {
									first: ['ībō'],
									second: ['ībis'],
									third: ['ībit'],
								},
								plural: {
									first: ['ībimus'],
									second: ['ībitis'],
									third: ['ībunt'],
								},
							},
							perfect: {
								singular: {
									first: ['iī', 'īvī'],
									second: ['iistī', 'īstī', 'īvistī'],
									third: ['iit', 'īvit'],
								},
								plural: {
									first: ['iimus', 'īvimus'],
									second: ['iistis', 'īstis', 'īvistis'],
									third: ['iērunt', 'iēre', 'īvērunt', 'īvēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['ieram', 'īveram'],
									second: ['ierās', 'īverās'],
									third: ['ierat', 'īverat'],
								},
								plural: {
									first: ['ierāmus', 'īverāmus'],
									second: ['ierātis', 'īverātis'],
									third: ['ierant', 'īverant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['ierō', 'īverō'],
									second: ['ieris', 'īveris'],
									third: ['ierit', 'īverit'],
								},
								plural: {
									first: ['ierimus', 'īverimus'],
									second: ['ieritis', 'īveritis'],
									third: ['ierint', 'īverint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['eor'],
									second: ['īris', 'īre'],
									third: ['ītur'],
								},
								plural: {
									first: ['īmur'],
									second: ['īminī'],
									third: ['euntur'],
								},
							},
							imperfect: {
								singular: {
									first: ['ībar'],
									second: ['ībāris', 'ībāre'],
									third: ['ībātur'],
								},
								plural: {
									first: ['ībāmur'],
									second: ['ībāminī'],
									third: ['ībantur'],
								},
							},
							future: {
								singular: {
									first: ['ībor'],
									second: ['īberis', 'ībere'],
									third: ['ībitur'],
								},
								plural: {
									first: ['ībimur'],
									second: ['ībiminī'],
									third: ['ībuntur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['eam'],
									second: ['eās'],
									third: ['eat'],
								},
								plural: {
									first: ['eāmus'],
									second: ['eātis'],
									third: ['eant'],
								},
							},
							imperfect: {
								singular: {
									first: ['īrem'],
									second: ['īrēs'],
									third: ['īret'],
								},
								plural: {
									first: ['īrēmus'],
									second: ['īrētis'],
									third: ['īrent'],
								},
							},
							perfect: {
								singular: {
									first: ['ierim', 'īverim'],
									second: ['ierīs', 'īverīs'],
									third: ['ierit', 'īverit'],
								},
								plural: {
									first: ['ierīmus', 'īverīmus'],
									second: ['ierītis', 'īverītis'],
									third: ['ierint', 'īverint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['iissem', 'īssem', 'īvissem'],
									second: ['iissēs', 'īssēs', 'īvissēs'],
									third: ['iisset', 'īsset', 'īvisset'],
								},
								plural: {
									first: ['iissēmus', 'īssēmus', 'īvissēmus'],
									second: ['iissētis', 'īssētis', 'īvissētis'],
									third: ['iissent', 'īssent', 'īvissent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['ear'],
									second: ['eāris', 'eāre'],
									third: ['eātur'],
								},
								plural: {
									first: ['eāmur'],
									second: ['eāminī'],
									third: ['eantur'],
								},
							},
							imperfect: {
								singular: {
									first: ['īrer'],
									second: ['īrēris', 'īrēre'],
									third: ['īrētur'],
								},
								plural: {
									first: ['īrēmur'],
									second: ['īrēminī'],
									third: ['īrentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['ī'],
								},
								plural: {
									second: ['īte'],
								},
							},
							future: {
								singular: {
									second: ['ītō'],
									third: ['ītō'],
								},
								plural: {
									second: ['ītōte'],
									third: ['euntō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['īre'],
								},
								plural: {
									second: ['īminī'],
								},
							},
							future: {
								singular: {
									second: ['ītor'],
									third: ['ītor'],
								},
								plural: {
									third: ['euntor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['īre'],
							perfect: ['iisse', 'īsse', 'īvisse'],
						},
						passive: {
							present: ['īrī', 'īrier'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: 'iēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: 'itūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({
								Lemma: 'itus',
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({
								Lemma: 'eundus',
							}).unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: 'eundus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['itum'],
						ablative: ['itū'],
					},
				};

				// If an eō verb is being treated as transitive, it should be because it has been explicitly marked as such.
				// So if it’s not explicitly marked, there should be a warning.
				if (rest.IsIntransitive !== true && rest.IsIntransitive !== false) {
					console.warn(
						'Please specify IsIntransitive as true or false for ',
						lemma,
					);
				}

				// Attach the prefix to all the forms of ‘eō’.
				forms = runLambdaOnObject(forms, (form) =>
					joinStemsToEndings(prefix, form)
						// Correct the oblique stem of present active participles.
						.map((form) =>
							form.replace(/oient/, 'oëunt').replace(/ient/, 'eunt'),
						)
						// Forms with -īv- should not exist for the bare verb ‘eō’ or for ‘abeō’.
						.filter((form) => !form.startsWith('īv') && !form.includes('abīv'))
						// Handle synaloepha in forms of ‘anteō’, eg ‘anteeat’ => ‘antēat’.
						.flatMap((form) =>
							form.startsWith('ante')
								? [
										...new Set([
											form,
											form
												.replace('eīss', 'īss')
												.replace('eīb', 'īb')
												.replace(/ee(?=[aā])/, 'ē'),
										]),
								  ]
								: form,
						),
				);
			} else if (rest.Conjugations?.includes('faciō')) {
				if (!lemma.endsWith('faciō') && !lemma.endsWith('ficiō')) {
					console.warn('Doesn’t end with faciō or ficiō: ' + Lemma);
				}
				const prefix = lemma.replace(/f[ai]ciō$/, '');
				const hasReducedVowel = lemma.endsWith('ficiō');

				const gerundVowels = rest.GerundVowels || ['e'];
				const gerunds = mergeObjects(
					gerundVowels.map(
						(vowel) =>
							inflectFuncs['Adjective']({
								Lemma: `faci${vowel}ndus`,
								ParsingsToExclude: ['nominative', 'vocative'],
							}).unencliticized.positive.neuter.singular,
					),
				);
				const gerundives = mergeObjects(
					gerundVowels.map(
						(vowel) =>
							inflectFuncs['Adjective']({ Lemma: `faci${vowel}ndus` })
								.unencliticized.positive,
					),
				);

				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['faciō'],
									second: ['facis'],
									third: ['facit'],
								},
								plural: {
									first: ['facimus'],
									second: ['facitis'],
									third: ['faciunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['faciēbam'],
									second: ['faciēbās'],
									third: ['faciēbat'],
								},
								plural: {
									first: ['faciēbāmus'],
									second: ['faciēbātis'],
									third: ['faciēbant'],
								},
							},
							future: {
								singular: {
									first: ['faciam'],
									second: ['faciēs'],
									third: ['faciet'],
								},
								plural: {
									first: ['faciēmus'],
									second: ['faciētis'],
									third: ['facient'],
								},
							},
							perfect: {
								singular: {
									first: ['fēcī'],
									second: ['fēcistī'],
									third: ['fēcit'],
								},
								plural: {
									first: ['fēcimus'],
									second: ['fēcistis'],
									third: ['fēcērunt', 'fēcēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['fēceram'],
									second: ['fēcerās'],
									third: ['fēcerat'],
								},
								plural: {
									first: ['fēcerāmus'],
									second: ['fēcerātis'],
									third: ['fēcerant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['fēcerō'],
									second: ['fēceris'],
									third: ['fēcerit'],
								},
								plural: {
									first: ['fēcerimus'],
									second: ['fēceritis'],
									third: ['fēcerint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['fīō'],
									second: ['fīs'],
									third: ['fit'],
								},
								plural: {
									first: ['fīmus'],
									second: ['fītis'],
									third: ['fīunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['fīēbam'],
									second: ['fīēbās'],
									third: ['fīēbat'],
								},
								plural: {
									first: ['fīēbāmus'],
									second: ['fīēbātis'],
									third: ['fīēbant'],
								},
							},
							future: {
								singular: {
									first: ['fīam'],
									second: ['fīēs'],
									third: ['fīet'],
								},
								plural: {
									first: ['fīēmus'],
									second: ['fīētis'],
									third: ['fīent'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['faciam'],
									second: ['faciās'],
									third: ['faciat'],
								},
								plural: {
									first: ['faciāmus'],
									second: ['faciātis'],
									third: ['faciant'],
								},
							},
							imperfect: {
								singular: {
									first: ['facerem'],
									second: ['facerēs'],
									third: ['faceret'],
								},
								plural: {
									first: ['facerēmus'],
									second: ['facerētis'],
									third: ['facerent'],
								},
							},
							perfect: {
								singular: {
									first: ['fēcerim'],
									second: ['fēcerīs'],
									third: ['fēcerit'],
								},
								plural: {
									first: ['fēcerīmus'],
									second: ['fēcerītis'],
									third: ['fēcerint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['fēcissem'],
									second: ['fēcissēs'],
									third: ['fēcisset'],
								},
								plural: {
									first: ['fēcissēmus'],
									second: ['fēcissētis'],
									third: ['fēcissent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['fīam'],
									second: ['fīās'],
									third: ['fīat'],
								},
								plural: {
									first: ['fīāmus'],
									second: ['fīātis'],
									third: ['fīant'],
								},
							},
							imperfect: {
								singular: {
									first: ['fierem', 'fīerem'],
									second: ['fierēs', 'fīerēs'],
									third: ['fieret', 'fīeret'],
								},
								plural: {
									first: ['fierēmus', 'fīerēmus'],
									second: ['fierētis', 'fīerētis'],
									third: ['fierent', 'fīerent'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['face'],
								},
								plural: {
									second: ['facite'],
								},
							},
							future: {
								singular: {
									second: ['facitō'],
									third: ['facitō'],
								},
								plural: {
									second: ['facitōte'],
									third: ['faciuntō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['fī'],
								},
								plural: {
									second: ['fīte'],
								},
							},
							future: {
								singular: {
									second: ['fītō'],
									third: ['fītō'],
								},
								plural: {
									second: ['fītōte'],
									third: ['fīuntō'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['facere'],
							perfect: ['fēcisse'],
						},
						passive: {
							present: ['fierī', 'fīerī'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: 'faciēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: 'factūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: 'factus' })
								.unencliticized.positive,
							future: gerundives,
						},
					},
					gerund: gerunds,
					supine: {
						accusative: ['factum'],
						ablative: ['factū'],
					},
				};

				// Attach the prefix to all the forms of ‘faciō’.
				forms = runLambdaOnObject(forms, (form) =>
					joinStemsToEndings(prefix, form)
						// Correct the stem vowel for verbs like ‘perficiō’, but keep ‘calficiō/calfactum’.
						.map((form) =>
							hasReducedVowel
								? form
										.replace(/(?<!cale?)fact/, 'fect')
										.replace(/fac(?!t)/, 'fic')
								: form,
						),
				);
			}

			if (rest.Conjugations?.includes(1) || rest.Conjugations?.includes('dō')) {
				const presentStem = lemma.replace(/(ō|or|at)$/, ''); // Replaces 1 in forms below.
				const perfectStems =
					rest.PerfectStems ||
					(rest.Conjugations?.includes('dō')
						? [presentStem + 'ed']
						: [presentStem + 'āv']); // Replaces 3 in forms below.
				const supineStems = rest.SupineStems || [presentStem + 'āt']; // Replaces 4 in forms below.
				const futureActiveParticipleStems =
					rest.FutureActiveParticipleStems || supineStems; // Replaces 5 in forms below.

				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['1ō'],
									second: ['1ās'],
									third: ['1at'],
								},
								plural: {
									first: ['1āmus'],
									second: ['1ātis'],
									third: ['1ant'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ābam'],
									second: ['1ābās'],
									third: ['1ābat'],
								},
								plural: {
									first: ['1ābāmus'],
									second: ['1ābātis'],
									third: ['1ābant'],
								},
							},
							future: {
								singular: {
									first: ['1ābō'],
									second: ['1ābis'],
									third: ['1ābit'],
								},
								plural: {
									first: ['1ābimus'],
									second: ['1ābitis'],
									third: ['1ābunt'],
								},
							},
							perfect: {
								singular: {
									first: ['3ī'],
									second: ['3istī'],
									third: ['3it'],
								},
								plural: {
									first: ['3imus'],
									second: ['3istis'],
									third: ['3ērunt', '3ēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3eram'],
									second: ['3erās'],
									third: ['3erat'],
								},
								plural: {
									first: ['3erāmus'],
									second: ['3erātis'],
									third: ['3erant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['3erō'],
									second: ['3eris'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erimus'],
									second: ['3eritis'],
									third: ['3erint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1or'],
									second: ['1āris', '1āre'],
									third: ['1ātur'],
								},
								plural: {
									first: ['1āmur'],
									second: ['1āminī'],
									third: ['1antur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ābar'],
									second: ['1ābāris', '1ābāre'],
									third: ['1ābātur'],
								},
								plural: {
									first: ['1ābāmur'],
									second: ['1ābāminī'],
									third: ['1ābantur'],
								},
							},
							future: {
								singular: {
									first: ['1ābor'],
									second: ['1āberis', '1ābere'],
									third: ['1ābitur'],
								},
								plural: {
									first: ['1ābimur'],
									second: ['1ābiminī'],
									third: ['1ābuntur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['1em'],
									second: ['1ēs'],
									third: ['1et'],
								},
								plural: {
									first: ['1ēmus'],
									second: ['1ētis'],
									third: ['1ent'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ārem'],
									second: ['1ārēs'],
									third: ['1āret'],
								},
								plural: {
									first: ['1ārēmus'],
									second: ['1ārētis'],
									third: ['1ārent'],
								},
							},
							perfect: {
								singular: {
									first: ['3erim'],
									second: ['3erīs'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erīmus'],
									second: ['3erītis'],
									third: ['3erint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3issem'],
									second: ['3issēs'],
									third: ['3isset'],
								},
								plural: {
									first: ['3issēmus'],
									second: ['3issētis'],
									third: ['3issent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1er'],
									second: ['1ēris', '1ēre'],
									third: ['1ētur'],
								},
								plural: {
									first: ['1ēmur'],
									second: ['1ēminī'],
									third: ['1entur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ārer'],
									second: ['1ārēris', '1ārēre'],
									third: ['1ārētur'],
								},
								plural: {
									first: ['1ārēmur'],
									second: ['1ārēminī'],
									third: ['1ārentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['1ā'],
								},
								plural: {
									second: ['1āte'],
								},
							},
							future: {
								singular: {
									second: ['1ātō'],
									third: ['1ātō'],
								},
								plural: {
									second: ['1ātōte'],
									third: ['1antō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['1āre'],
								},
								plural: {
									second: ['1āminī'],
								},
							},
							future: {
								singular: {
									second: ['1ātor'],
									third: ['1ātor'],
								},
								plural: {
									third: ['1antor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['1āre'],
							perfect: ['3isse'],
						},
						passive: {
							present: ['1ārī'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: '1āns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '5ūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: '4us' })
								.unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '1andus' })
								.unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: '1andus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['4um'],
						ablative: ['4ū'],
					},
				};

				if (rest.HasArchaicInfinitiveInIer) {
					forms = mergeTwoObjects(forms, {
						infinitive: { passive: { present: ['1ārier'] } },
					});
				}

				const hasSyncopatedPerfectForms =
					rest.HasSyncopatedPerfectForms ??
					perfectStems.some((stem) => stem.endsWith('āv'));

				forms = runLambdaOnObject(forms, (form) => {
					if (form.startsWith('1')) {
						return joinStemsToEndings(presentStem, form.substring(1));
					}
					if (form.startsWith('3')) {
						return joinStemsToEndings(
							perfectStems,
							form.substring(1),
							hasSyncopatedPerfectForms,
						);
					}
					if (form.startsWith('4')) {
						return joinStemsToEndings(supineStems, form.substring(1));
					}
					if (form.startsWith('5')) {
						return joinStemsToEndings(
							futureActiveParticipleStems,
							form.substring(1),
						);
					}
					return form;
				});

				if (rest.Conjugations.includes('dō')) {
					// Perfect stem should be “ded”.
					// “a” in endings should be short (except in ‘dā’, ‘dās’, ‘dāns’).
					forms = runLambdaOnObject(forms, (form) =>
						form
							.replace(/dāv(?=[^d]+$)/, 'ded')
							.replace(/dā(?!ns)(?!s)(?=[^d]+$)/, 'da'),
					);
				}
			}

			if (rest.Conjugations?.includes(2)) {
				const presentStem = lemma.replace(/e(ō|or|t)$/, ''); // Replaces 1 in forms below.
				const perfectStems = rest.PerfectStems || [presentStem + 'u']; // Replaces 3 in forms below.
				const supineStems = rest.SupineStems || [presentStem + 'it']; // Replaces 4 in forms below.

				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['1eō'],
									second: ['1ēs'],
									third: ['1et'],
								},
								plural: {
									first: ['1ēmus'],
									second: ['1ētis'],
									third: ['1ent'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ēbam'],
									second: ['1ēbās'],
									third: ['1ēbat'],
								},
								plural: {
									first: ['1ēbāmus'],
									second: ['1ēbātis'],
									third: ['1ēbant'],
								},
							},
							future: {
								singular: {
									first: ['1ēbō'],
									second: ['1ēbis'],
									third: ['1ēbit'],
								},
								plural: {
									first: ['1ēbimus'],
									second: ['1ēbitis'],
									third: ['1ēbunt'],
								},
							},
							perfect: {
								singular: {
									first: ['3ī'],
									second: ['3istī'],
									third: ['3it'],
								},
								plural: {
									first: ['3imus'],
									second: ['3istis'],
									third: ['3ērunt', '3ēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3eram'],
									second: ['3erās'],
									third: ['3erat'],
								},
								plural: {
									first: ['3erāmus'],
									second: ['3erātis'],
									third: ['3erant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['3erō'],
									second: ['3eris'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erimus'],
									second: ['3eritis'],
									third: ['3erint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1eor'],
									second: ['1ēris', '1ēre'],
									third: ['1ētur'],
								},
								plural: {
									first: ['1ēmur'],
									second: ['1ēminī'],
									third: ['1entur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ēbar'],
									second: ['1ēbāris', '1ēbāre'],
									third: ['1ēbātur'],
								},
								plural: {
									first: ['1ēbāmur'],
									second: ['1ēbāminī'],
									third: ['1ēbantur'],
								},
							},
							future: {
								singular: {
									first: ['1ēbor'],
									second: ['1ēberis', '1ēbere'],
									third: ['1ēbitur'],
								},
								plural: {
									first: ['1ēbimur'],
									second: ['1ēbiminī'],
									third: ['1ēbuntur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['1eam'],
									second: ['1eās'],
									third: ['1eat'],
								},
								plural: {
									first: ['1eāmus'],
									second: ['1eātis'],
									third: ['1eant'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ērem'],
									second: ['1ērēs'],
									third: ['1ēret'],
								},
								plural: {
									first: ['1ērēmus'],
									second: ['1ērētis'],
									third: ['1ērent'],
								},
							},
							perfect: {
								singular: {
									first: ['3erim'],
									second: ['3erīs'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erīmus'],
									second: ['3erītis'],
									third: ['3erint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3issem'],
									second: ['3issēs'],
									third: ['3isset'],
								},
								plural: {
									first: ['3issēmus'],
									second: ['3issētis'],
									third: ['3issent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1ear'],
									second: ['1eāris', '1eāre'],
									third: ['1eātur'],
								},
								plural: {
									first: ['1eāmur'],
									second: ['1eāminī'],
									third: ['1eantur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ērer'],
									second: ['1ērēris', '1ērēre'],
									third: ['1ērētur'],
								},
								plural: {
									first: ['1ērēmur'],
									second: ['1ērēminī'],
									third: ['1ērentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['1ē'],
								},
								plural: {
									second: ['1ēte'],
								},
							},
							future: {
								singular: {
									second: ['1ētō'],
									third: ['1ētō'],
								},
								plural: {
									second: ['1ētōte'],
									third: ['1entō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['1ēre'],
								},
								plural: {
									second: ['1ēminī'],
								},
							},
							future: {
								singular: {
									second: ['1ētor'],
									third: ['1ētor'],
								},
								plural: {
									third: ['1entor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['1ēre'],
							perfect: ['3isse'],
						},
						passive: {
							present: ['1ērī'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: '1ēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '4ūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: '4us' })
								.unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '1endus' })
								.unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: '1endus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['4um'],
						ablative: ['4ū'],
					},
				};

				if (rest.HasArchaicInfinitiveInIer) {
					forms = mergeTwoObjects(forms, {
						infinitive: { passive: { present: ['1ērier'] } },
					});
				}

				if (
					![true, false].includes(rest.HasSyncopatedPerfectForms) &&
					perfectStems.some((stem) => stem.endsWith('ēv'))
				) {
					console.warn(
						'Please define HasSyncopatedPerfectForms as true or false for',
						lemma,
					);
				}
				const hasSyncopatedPerfectForms =
					rest.HasSyncopatedPerfectForms ??
					perfectStems.some((stem) => stem.endsWith('ēv'));

				forms = runLambdaOnObject(forms, (form) => {
					if (form.startsWith('1')) {
						return joinStemsToEndings(presentStem, form.substring(1));
					}
					if (form.startsWith('3')) {
						return joinStemsToEndings(
							perfectStems,
							form.substring(1),
							hasSyncopatedPerfectForms,
						);
					}
					if (form.startsWith('4')) {
						return joinStemsToEndings(supineStems, form.substring(1));
					}
					return form;
				});
			}

			if (rest.Conjugations?.includes(3)) {
				if (!rest.SupineStems) {
					console.warn('SupineStems not set for ' + Lemma);
				}
				if (!rest.PerfectStems && !isDeponent && !rest.IsSemiDeponent) {
					console.warn('PerfectStems not set for ' + Lemma);
				}

				const presentStem = lemma.replace(/(ō|or|it)$/, ''); // Replaces 1 in forms below.
				const presentInfinitiveStem = presentStem.replace(/i$/, ''); // Replaces 2 in forms below.
				const perfectStems = rest.PerfectStems || [presentStem + 's']; // Replaces 3 in forms below.
				const supineStems = rest.SupineStems || [presentStem + 't']; // Replaces 4 in forms below.
				const futureActiveParticipleStems =
					rest.FutureActiveParticipleStems || supineStems; // Replaces 5 in forms below.
				const gerundVowels = rest.GerundVowels || ['e'];
				const gerundStemsAsFarAsVowel = joinStemsToEndings(
					presentStem,
					gerundVowels,
				); // Eg "geru" for "gerundum"; replaces 6 in forms below.

				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['1ō'],
									second: ['2is'],
									third: ['2it'],
								},
								plural: {
									first: ['2imus'],
									second: ['2itis'],
									third: ['1unt'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ēbam'],
									second: ['1ēbās'],
									third: ['1ēbat'],
								},
								plural: {
									first: ['1ēbāmus'],
									second: ['1ēbātis'],
									third: ['1ēbant'],
								},
							},
							future: {
								singular: {
									first: ['1am'],
									second: ['1ēs'],
									third: ['1et'],
								},
								plural: {
									first: ['1ēmus'],
									second: ['1ētis'],
									third: ['1ent'],
								},
							},
							perfect: {
								singular: {
									first: ['3ī'],
									second: ['3istī'],
									third: ['3it'],
								},
								plural: {
									first: ['3imus'],
									second: ['3istis'],
									third: ['3ērunt', '3ēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3eram'],
									second: ['3erās'],
									third: ['3erat'],
								},
								plural: {
									first: ['3erāmus'],
									second: ['3erātis'],
									third: ['3erant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['3erō'],
									second: ['3eris'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erimus'],
									second: ['3eritis'],
									third: ['3erint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1or'],
									second: ['2eris', '2ere'],
									third: ['2itur'],
								},
								plural: {
									first: ['2imur'],
									second: ['2iminī'],
									third: ['1untur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1ēbar'],
									second: ['1ēbāris', '1ēbāre'],
									third: ['1ēbātur'],
								},
								plural: {
									first: ['1ēbāmur'],
									second: ['1ēbāminī'],
									third: ['1ēbantur'],
								},
							},
							future: {
								singular: {
									first: ['1ar'],
									second: ['1ēris', '1ēre'],
									third: ['1ētur'],
								},
								plural: {
									first: ['1ēmur'],
									second: ['1ēminī'],
									third: ['1entur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['1am'],
									second: ['1ās'],
									third: ['1at'],
								},
								plural: {
									first: ['1āmus'],
									second: ['1ātis'],
									third: ['1ant'],
								},
							},
							imperfect: {
								singular: {
									first: ['2erem'],
									second: ['2erēs'],
									third: ['2eret'],
								},
								plural: {
									first: ['2erēmus'],
									second: ['2erētis'],
									third: ['2erent'],
								},
							},
							perfect: {
								singular: {
									first: ['3erim'],
									second: ['3erīs'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erīmus'],
									second: ['3erītis'],
									third: ['3erint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3issem'],
									second: ['3issēs'],
									third: ['3isset'],
								},
								plural: {
									first: ['3issēmus'],
									second: ['3issētis'],
									third: ['3issent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1ar'],
									second: ['1āris', '1āre'],
									third: ['1ātur'],
								},
								plural: {
									first: ['1āmur'],
									second: ['1āminī'],
									third: ['1antur'],
								},
							},
							imperfect: {
								singular: {
									first: ['2erer'],
									second: ['2erēris', '2erēre'],
									third: ['2erētur'],
								},
								plural: {
									first: ['2erēmur'],
									second: ['2erēminī'],
									third: ['2erentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['2e'],
								},
								plural: {
									second: ['2ite'],
								},
							},
							future: {
								singular: {
									second: ['2itō'],
									third: ['2itō'],
								},
								plural: {
									second: ['2itōte'],
									third: ['1untō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['2ere'],
								},
								plural: {
									second: ['2iminī'],
								},
							},
							future: {
								singular: {
									second: ['2itor'],
									third: ['2itor'],
								},
								plural: {
									third: ['1untor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['2ere'],
							perfect: ['3isse'],
						},
						passive: {
							present: ['2ī'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: '1ēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '5ūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: '4us' })
								.unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '6ndus' })
								.unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: '6ndus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['4um'],
						ablative: ['4ū'],
					},
				};

				if (rest.HasArchaicInfinitiveInIer) {
					forms = mergeTwoObjects(forms, {
						infinitive: { passive: { present: ['2ier'] } },
					});
				}

				if (
					![true, false].includes(rest.HasSyncopatedPerfectForms) &&
					perfectStems.some(
						(stem) =>
							stem.endsWith('ēv') || stem.endsWith('īv') || stem.endsWith('ōv'),
					)
				) {
					console.warn(
						'Please define HasSyncopatedPerfectForms as true or false for',
						lemma,
					);
				}
				const hasSyncopatedPerfectForms =
					rest.HasSyncopatedPerfectForms ??
					perfectStems.some((stem) => stem.endsWith('ōv'));

				forms = runLambdaOnObject(forms, (form) => {
					if (form.startsWith('1')) {
						return joinStemsToEndings(presentStem, form.substring(1));
					}
					if (form.startsWith('2')) {
						return joinStemsToEndings(presentInfinitiveStem, form.substring(1));
					}
					if (form.startsWith('3')) {
						return joinStemsToEndings(
							perfectStems,
							form.substring(1),
							hasSyncopatedPerfectForms,
						);
					}
					if (form.startsWith('4')) {
						return joinStemsToEndings(supineStems, form.substring(1));
					}
					if (form.startsWith('5')) {
						return joinStemsToEndings(
							futureActiveParticipleStems,
							form.substring(1),
						);
					}
					if (form.startsWith('6')) {
						return joinStemsToEndings(
							gerundStemsAsFarAsVowel,
							form.substring(1),
						);
					}
					return form;
				});
			}

			if (rest.Conjugations?.includes(4)) {
				const presentStem = lemma.replace(/i(ō|or)$/, ''); // Replaces 1 in forms below.
				const perfectStems = rest.PerfectStems || [
					presentStem + 'īv',
					presentStem + 'i',
				]; // Replaces 3 in forms below.
				const supineStems = rest.SupineStems || [presentStem + 'īt']; // Replaces 4 in forms below.
				const futureActiveParticipleStems =
					rest.FutureActiveParticipleStems || supineStems; // Replaces 5 in forms below.
				const gerundVowels = rest.GerundVowels || ['e'];
				const gerundStemsAsFarAsVowel = joinStemsToEndings(
					presentStem + 'i',
					gerundVowels,
				); // Eg "oriu" for "oriundum"; replaces 6 in forms below.

				forms = {
					indicative: {
						active: {
							present: {
								singular: {
									first: ['1iō'],
									second: ['1īs'],
									third: ['1it'],
								},
								plural: {
									first: ['1īmus'],
									second: ['1ītis'],
									third: ['1iunt'],
								},
							},
							imperfect: {
								singular: {
									first: ['1iēbam'],
									second: ['1iēbās'],
									third: ['1iēbat'],
								},
								plural: {
									first: ['1iēbāmus'],
									second: ['1iēbātis'],
									third: ['1iēbant'],
								},
							},
							future: {
								singular: {
									first: ['1iam'],
									second: ['1iēs'],
									third: ['1iet'],
								},
								plural: {
									first: ['1iēmus'],
									second: ['1iētis'],
									third: ['1ient'],
								},
							},
							perfect: {
								singular: {
									first: ['3ī'],
									second: ['3istī'],
									third: ['3it'],
								},
								plural: {
									first: ['3imus'],
									second: ['3istis'],
									third: ['3ērunt', '3ēre'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3eram'],
									second: ['3erās'],
									third: ['3erat'],
								},
								plural: {
									first: ['3erāmus'],
									second: ['3erātis'],
									third: ['3erant'],
								},
							},
							futureperfect: {
								singular: {
									first: ['3erō'],
									second: ['3eris'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erimus'],
									second: ['3eritis'],
									third: ['3erint'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1ior'],
									second: ['1īris', '1īre'],
									third: ['1ītur'],
								},
								plural: {
									first: ['1īmur'],
									second: ['1īminī'],
									third: ['1iuntur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1iēbar'],
									second: ['1iēbāris', '1iēbāre'],
									third: ['1iēbātur'],
								},
								plural: {
									first: ['1iēbāmur'],
									second: ['1iēbāminī'],
									third: ['1iēbantur'],
								},
							},
							future: {
								singular: {
									first: ['1iar'],
									second: ['1iēris', '1iēre'],
									third: ['1iētur'],
								},
								plural: {
									first: ['1iēmur'],
									second: ['1iēminī'],
									third: ['1ientur'],
								},
							},
						},
					},
					subjunctive: {
						active: {
							present: {
								singular: {
									first: ['1iam'],
									second: ['1iās'],
									third: ['1iat'],
								},
								plural: {
									first: ['1iāmus'],
									second: ['1iātis'],
									third: ['1iant'],
								},
							},
							imperfect: {
								singular: {
									first: ['1īrem'],
									second: ['1īrēs'],
									third: ['1īret'],
								},
								plural: {
									first: ['1īrēmus'],
									second: ['1īrētis'],
									third: ['1īrent'],
								},
							},
							perfect: {
								singular: {
									first: ['3erim'],
									second: ['3erīs'],
									third: ['3erit'],
								},
								plural: {
									first: ['3erīmus'],
									second: ['3erītis'],
									third: ['3erint'],
								},
							},
							pluperfect: {
								singular: {
									first: ['3issem'],
									second: ['3issēs'],
									third: ['3isset'],
								},
								plural: {
									first: ['3issēmus'],
									second: ['3issētis'],
									third: ['3issent'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									first: ['1iar'],
									second: ['1iāris', '1iāre'],
									third: ['1iātur'],
								},
								plural: {
									first: ['1iāmur'],
									second: ['1iāminī'],
									third: ['1iantur'],
								},
							},
							imperfect: {
								singular: {
									first: ['1īrer'],
									second: ['1īrēris', '1īrēre'],
									third: ['1īrētur'],
								},
								plural: {
									first: ['1īrēmur'],
									second: ['1īrēminī'],
									third: ['1īrentur'],
								},
							},
						},
					},
					imperative: {
						active: {
							present: {
								singular: {
									second: ['1ī'],
								},
								plural: {
									second: ['1īte'],
								},
							},
							future: {
								singular: {
									second: ['1ītō'],
									third: ['1ītō'],
								},
								plural: {
									second: ['1ītōte'],
									third: ['1iuntō'],
								},
							},
						},
						passive: {
							present: {
								singular: {
									second: ['1īre'],
								},
								plural: {
									second: ['1īminī'],
								},
							},
							future: {
								singular: {
									second: ['1ītor'],
									third: ['1ītor'],
								},
								plural: {
									third: ['1iuntor'],
								},
							},
						},
					},
					infinitive: {
						active: {
							present: ['1īre'],
							perfect: ['3isse'],
						},
						passive: {
							present: ['1īrī'],
						},
					},
					participle: {
						active: {
							present: inflectFuncs['Adjective']({
								Lemma: '1iēns',
								IsPresentParticiple: true,
							}).unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '5ūrus' })
								.unencliticized.positive,
						},
						passive: {
							perfect: inflectFuncs['Adjective']({ Lemma: '4us' })
								.unencliticized.positive,
							future: inflectFuncs['Adjective']({ Lemma: '6ndus' })
								.unencliticized.positive,
						},
					},
					gerund: inflectFuncs['Adjective']({
						Lemma: '6ndus',
						ParsingsToExclude: ['nominative', 'vocative'],
					}).unencliticized.positive.neuter.singular,
					supine: {
						accusative: ['4um'],
						ablative: ['4ū'],
					},
				};

				if (rest.HasArchaicInfinitiveInIer) {
					forms = mergeTwoObjects(forms, {
						infinitive: { passive: { present: ['1īrier'] } },
					});
				}

				const hasSyncopatedPerfectForms =
					rest.HasSyncopatedPerfectForms ??
					perfectStems.some((stem) => stem.endsWith('īv'));

				forms = runLambdaOnObject(forms, (form) => {
					if (form.startsWith('1')) {
						return joinStemsToEndings(presentStem, form.substring(1));
					}
					if (form.startsWith('3')) {
						return joinStemsToEndings(
							perfectStems,
							form.substring(1),
							hasSyncopatedPerfectForms,
						);
					}
					if (form.startsWith('4')) {
						return joinStemsToEndings(supineStems, form.substring(1));
					}
					if (form.startsWith('5')) {
						return joinStemsToEndings(
							futureActiveParticipleStems,
							form.substring(1),
						);
					}
					if (form.startsWith('6')) {
						return joinStemsToEndings(
							gerundStemsAsFarAsVowel,
							form.substring(1),
						);
					}
					return form;
				});
			}

			if (rest.Conjugations?.length > 1) {
				console.warn(
					`Verb ${Lemma} may be misconjugated because its conjugations are given as `,
					rest.Conjugations,
				);
			}

			if (JSON.stringify(forms) === '{}') {
				if (!rest.Conjugations || !rest.Conjugations.length) {
					console.debug('Conjugations not specified for', Lemma);
				}

				console.warn('No forms for ' + Lemma);
				return {};
			}

			// Give active perfect participles to deponents & semi-deponents.
			if (isDeponent || rest.IsSemiDeponent) {
				forms.participle.active.perfect = structuredClone(
					forms.participle.passive.perfect,
				);

				if (!rest.HasPerfectPassiveParticiple) {
					delete forms.participle.passive.perfect;
				}
			}

			if (isDeponent) {
				forms.indicative.active = forms.indicative.passive;
				delete forms.indicative.passive;
				forms.subjunctive.active = forms.subjunctive.passive;
				delete forms.subjunctive.passive;
				forms.infinitive.active = forms.infinitive.passive;
				delete forms.infinitive.passive;
				forms.imperative.active = forms.imperative.passive;
				delete forms.imperative.passive;
			}

			if (rest.IsSemiDeponent) {
				delete forms.indicative.active.perfect;
				delete forms.indicative.active.pluperfect;
				delete forms.indicative.active.futureperfect;
				delete forms.subjunctive.active.perfect;
				delete forms.subjunctive.active.pluperfect;
				delete forms.infinitive.active.perfect;

				delete forms.indicative.passive;
				delete forms.subjunctive.passive;
				delete forms.imperative.passive;
				delete forms.infinitive.passive;
			}

			if (rest.IsImpersonal) {
				forms = deleteUnwantedForms(forms, [
					'first',
					'second',
					'plural',
					'supine',
					'masculine',
					'feminine',
					'vocative',
				]);
				delete forms.indicative.passive;
				delete forms.subjunctive.passive;
				delete forms.infinitive.passive;
				delete forms.imperative.passive;
				delete forms.participle.passive.future;
				delete forms.participle.passive.perfect?.neuter.plural;
			}

			if (
				rest.HasPerfectActiveParticiple &&
				// Deponent & semi-deponent verbs should have already had their passive perfect participles relabelled as active.
				!isDeponent &&
				!rest.IsSemiDeponent
			) {
				forms.participle.active.perfect = structuredClone(
					forms.participle.passive.perfect,
				);
			}

			if (rest.IsIntransitive) {
				forms = deleteFormsForIntransitiveVerb(forms, rest);
			}
			if (
				lemma.endsWith('scō') &&
				rest.IsIntransitive !== true &&
				rest.IsIntransitive !== false
			) {
				console.warn(`IsIntransitive is not set for ${lemma}`);
			}
		}

		//  if (rest["20230115"] && rest.Conjugations?.includes(1)) {
		// 	console.log(`Conjugations ${rest.Conjugations} for ${Lemma}`);
		//  }

		forms = applyFieldsToForms(forms, rest);
		// if (lemma === 'lavō') {
		// 	consoleLogAsJson(forms);
		// }

		return forms;
	},
};

function convertParsingObjectToFormsArray(parsingObject) {
	if (!parsingObject) {
		console.warn(
			`parsingObject is ${parsingObject} in convertParsingObjectToFormsArray`,
		);
		return [];
	}
	if (Array.isArray(parsingObject)) {
		return parsingObject;
	}
	if (typeof parsingObject === 'string') {
		console.warn(`parsingObject is a string: ${parsingObject}`);
	}
	return (
		Object.values(parsingObject)
			// .filter(object => object !== null && object !== undefined)
			.flatMap((object) => convertParsingObjectToFormsArray(object))
	);
}
function convertParsingObjectToFormsSet(parsingObject) {
	return new Set(convertParsingObjectToFormsArray(parsingObject));
}
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
function isSuperset(set, subset) {
	for (const elem of subset) {
		if (!set.has(elem)) {
			return false;
		}
	}
	return true;
}
function isEqualSet(set1, set2) {
	if (set1.size !== set2.size) {
		return false;
	}
	return isSuperset(set1, set2);
}
function subtractSet(superset, setToSubtract) {
	const _difference = new Set(superset);
	for (const elem of setToSubtract) {
		_difference.delete(elem);
	}
	return _difference;
}

// Some lemmata have the part of speech given in brackets, eg amĭcus[n] & amĭcus[adj]
// This function checks that this is correct for the lemma’s PartOfSpeech property.
function checkPartOfSpeechInBrackets(lemmaObject) {
	if (!lemmaObject) return;
	if (!lemmaObject.Lemma) return;
	if (!lemmaObject.Lemma.includes('[')) return;

	const textInBrackets = lemmaObject.Lemma.replace(/.+\[/, '').replace(']', '');
	if (!textInBrackets) {
		return true;
	}

	const partsOfSpeech = {
		n: 'Noun',
		prn: 'Proper noun',
		pro: 'Pronoun',
		adj: 'Adjective',
		v: 'Verb',
		adv: 'Adverb',
		con: 'Conjunction',
		pre: 'Preposition',
		int: 'Interjection',
	};

	if (partsOfSpeech[textInBrackets] === undefined) {
		return true;
	}
	return partsOfSpeech[textInBrackets] === lemmaObject.PartOfSpeech;
}

//// `outputAsObject` gets modified by `convertInputToOutputData` inside `generateJson`
//// and either gets displayed in the second text-area by `displayOutput` (in web.js)
//// or gets written to a file (in the Node-only section).
let outputAsObject = {};

const validPartsOfSpeech = Object.keys(inflectFuncs);

function clearOutputObject() {
	return (outputAsObject = {});
}

function convertInputToOutputData(lemmata) {
	clearOutputObject(); // Clear the output in case there’s anything from previous runs.
	const countRows = lemmata.length;

	//// For each line of values in the input...
	for (let i = 0; i < countRows; i++) {
		const lemma = lemmata[i];

		if (!lemma.Lemma) {
			console.error(`Lemma property missing from lemma ${i}`);
			continue;
		}

		if (!lemma.PartOfSpeech) {
			console.error(`PartOfSpeech property missing from lemma ${i}`);
			continue;
		}

		if (!validPartsOfSpeech.includes(lemma.PartOfSpeech)) {
			console.error(`Not a valid PartOfSpech: ${lemma.PartOfSpeech}`);
			continue;
		}

		try {
			const DOES_PART_OF_SPEECH_GET_CHECKED = false;

			if (
				DOES_PART_OF_SPEECH_GET_CHECKED &&
				checkPartOfSpeechInBrackets(lemma) === false
			) {
				console.warn(
					`Part of speech of ${lemma.Lemma} is ${lemma.PartOfSpeech}`,
				);
			}

			const parsingData = inflectFuncs[lemma.PartOfSpeech](lemma);

			if (Object.keys(parsingData).length === 0) {
				console.log(
					`Inflection function has not been defined for ${lemma.PartOfSpeech}.`,
				);
			}
			outputAsObject[lemma.Lemma] = parsingData;
		} catch (error) {
			console.error(
				`Error when processing lemma ${i} (${lemma.Lemma}) — ${error}`,
			);
		}
	}
	return outputAsObject;
}

////
//// Code that only runs in Node:
//// (Divided into functions for easier commenting-out when debugging.)
////

if (typeof require !== 'undefined') {
	const fs = require('fs');

	function runAllWords() {
		const FOLDER_PATH =
			'C:/Users/Duncan Ritchie/Documents/Code/velut/velutSideAssets/Json/';

		//// Input data are an array of lemma objects.
		const inputFileUrl = FOLDER_PATH + 'lemmata-nongenerated-fields.json';
		const inputLemmata = require(inputFileUrl);
		//// Output data are generated in batches & each batch is written to a file.
		//// This allows me to track the output in Git without tracking a huge file.
		const outputFileUrlWithAmbiguousStress =
			FOLDER_PATH + `words-from-inflector_with-ambiguous-stress.json`;
		const outputFileUrlWithAmbiguousStressHandled =
			FOLDER_PATH + `words-from-inflector_with-ambiguous-stress-handled.json`;
		function getOutputFileUrlForBatchAfterHandingAmbiguousStress(batchNumber) {
			return (
				FOLDER_PATH + `words-from-inflector_mongo_batch${batchNumber}.json`
			);
		}
		const batchSize = 1000;
		//// The output batches are concatenated into one file, for Git to ignore and me to (maybe) import to MongoDB.
		const outputFileUrl = FOLDER_PATH + 'words-from-inflector_mongo.json';
		//// The output from the Inflector is also merged into the input lemmata data, for Git to ignore and me to import to MongoDB.
		const combinedOutputFileUrl =
			FOLDER_PATH + 'lemmata-with-words-from-inflector_mongo.json';
		//// For regression testing, I have a file of expected output, that the actual output is compared against.
		const expectedOutputFileUrl =
			FOLDER_PATH + 'lemmata-from-collator_mongo.json';
		//// This will go into a `summary` MongoDB collection which will be read from a page on the velut site giving my progress in generating and checking inflections.
		const summaryFileUrl = FOLDER_PATH + 'summary-from-inflector_mongo.json';

		try {
			let batchFilepaths = [];

			let successCount = 0;
			let errorCount = 0;
			let noTestDataCount = 0;
			let skippedCount = 0;
			let totalLemmata = 0;
			let countNotChecked = 0;

			function generateOutput() {
				console.time('generatingOutput');

				const output = convertInputToOutputData(inputLemmata);
				const outputAsArray = Object.entries(output).map(([key, value]) => ({
					Lemma: key,
					Forms: value,
				}));

				fs.writeFileSync(
					outputFileUrlWithAmbiguousStress,
					JSON.stringify(outputAsArray, null, '\t'),
				);

				console.log(
					'Output all data! See your file at ' +
						outputFileUrlWithAmbiguousStress,
				);

				console.timeEnd('generatingOutput');
			}

			function replaceFormsOfAmbiguousStress() {
				console.time('replacingFormsOfAmbiguousStress');

				const allOutput = require(outputFileUrlWithAmbiguousStress);

				const formsStressedOnPenultAndTheirAddresses = [];
				const otherFormsAndTheirAddresses = [];
				const setOfFormsStressedOnPenult = new Set();
				const setOfOtherForms = new Set();

				const sliceOfOutput = allOutput;
				// .slice(0, 3000);
				function deleteLastSyllable(word) {
					return word.replace(
						/(([bcdfgkpt][lr])|[bcdfglmnprstv]|ch|ph|qu|th)?([aeiouyāēīōūȳ]|ae|au|oe)[bcdfgklmnpqrstvxz]*h?$/,
						'',
					);
				}

				function isPolysyllabicWithLightPenult(word) {
					const wordWithoutUltima = deleteLastSyllable(word);
					const hasHeavyPenult = /(ae|au|oe|[āēīōūȳbcdfgklmnprstvxz]|qu)$/.test(
						wordWithoutUltima,
					);
					const hasMoreThanOneSyllable = /[aeiouyāēīōūȳ]/.test(
						wordWithoutUltima,
					);
					const hasMoreThanTwoSyllables =
						hasMoreThanOneSyllable &&
						/[aeiouyāēīōūȳ]/.test(deleteLastSyllable(wordWithoutUltima)) &&
						word !== 'cuique'; // cuique has 2 syllables because “ui” is a diphthong in this word.
					const wordIsPolysyllabicWithLightPenult =
						hasMoreThanTwoSyllables && !hasHeavyPenult;

					// console.log(
					// 	wordWithoutUltima,
					// 	word,
					// 	wordIsPolysyllabicWithLightPenult,
					// );
					return wordIsPolysyllabicWithLightPenult;
				}

				function addAcuteToPenult(word) {
					const wordWithoutUltima = deleteLastSyllable(word);
					const ultima = word.replace(wordWithoutUltima, '');
					const wordWithoutPenultOrUltima =
						deleteLastSyllable(wordWithoutUltima);
					const penult = wordWithoutUltima.replace(
						wordWithoutPenultOrUltima,
						'',
					);
					const penultWithAcute = penult.replace(/[aeiouy]/, (vowel) =>
						`${vowel}\u0301`.normalize('NFC'),
					);
					return wordWithoutPenultOrUltima + penultWithAcute + ultima;
				}

				function convertFormsObjectIntoParsingsArray(lemmaWithForms) {
					function traverseObject(object, previousKeys) {
						Object.entries(object).forEach(([key, value]) => {
							if (key === 'incorrect') {
								return;
							}

							const keys = [...previousKeys, key];

							if (Array.isArray(value)) {
								value.forEach((form) => {
									const formAsObject = {
										Form: form,
										Lemma: lemmaWithForms.Lemma,
										Keys: keys,
									};
									if (isPolysyllabicWithLightPenult(form)) {
										if (
											keys.includes('ne') ||
											keys.includes('que') ||
											keys.includes('ve')
										) {
											formsStressedOnPenultAndTheirAddresses.push(formAsObject);
											setOfFormsStressedOnPenult.add(form);
											return;
										}
										const lemmaWithoutBrackets = removeBrackets(
											lemmaWithForms.Lemma,
										);
										if (
											(lemmaWithoutBrackets.endsWith('ius') ||
												lemmaWithoutBrackets.endsWith('ium')) &&
											form.endsWith('ī') &&
											!form.endsWith('iī') &&
											!form.endsWith('issimī')
										) {
											// console.log(
											// 	'Is this a syncopated genitive or vocative from -ius/-ium?',
											// 	form,
											// 	lemmaWithForms.Lemma,
											// );
											formsStressedOnPenultAndTheirAddresses.push(formAsObject);
											setOfFormsStressedOnPenult.add(form);
											return;
										}
									}

									setOfOtherForms.add(form);
									otherFormsAndTheirAddresses.push(formAsObject);
								});
								return;
							}
							traverseObject(value, keys);
						});
					}
					traverseObject(lemmaWithForms.Forms, []);
				}

				sliceOfOutput.forEach((lemma) => {
					convertFormsObjectIntoParsingsArray(lemma);
				});

				setOfFormsStressedOnPenult.forEach((formStressedOnPenult) => {
					if (setOfOtherForms.has(formStressedOnPenult)) {
						const formWithAcuteAdded = addAcuteToPenult(formStressedOnPenult);
						console.log(
							`Form has ambiguous stress! Disambiguating ${formStressedOnPenult} to ${formWithAcuteAdded}`,
						);

						formsStressedOnPenultAndTheirAddresses
							.filter((formObject) => {
								// console.debug(formObject);
								return formObject && formObject.Form === formStressedOnPenult;
							})
							.forEach((address) => {
								// console.log(address);
								const lemmaInOutput = sliceOfOutput.find(
									(lemmaObject) => lemmaObject.Lemma === address.Lemma,
								);
								let formsArrayInOutput = lemmaInOutput.Forms;
								for (let i = 0; i < address.Keys.length; i++) {
									// console.log(formsArrayInOutput);
									formsArrayInOutput = formsArrayInOutput[address.Keys[i]];
								}
								// console.log(formsArrayInOutput);
								// const arrayWithSubstitution =
								formsArrayInOutput.splice(
									formsArrayInOutput.indexOf(formStressedOnPenult),
									1,
									formWithAcuteAdded,
								);
								// console.log(arrayWithSubstitution);
								// consoleLogAsJson(lemmaInOutput);
							});
					} else {
						// console.log(
						// 	'Form does not have ambiguous stress',
						// 	formStressedOnPenult,
						// );
					}
				});

				// console.log(allFormsAndTheirAddresses);
				fs.writeFileSync(
					outputFileUrlWithAmbiguousStressHandled,
					JSON.stringify(sliceOfOutput, null, '\t'),
				);
				console.timeEnd('replacingFormsOfAmbiguousStress');
			}

			function divideIntoBatches() {
				console.time('divideIntoBatches');

				//// Eg [1,2,3,4,5,6,7], 2 => [[1,2],[3,4],[5,6],[7]]
				// from https://stackoverflow.com/a/54029307
				function splitArrayIntoBatches(array, size) {
					return array.length > size
						? [
								array.slice(0, size),
								...splitArrayIntoBatches(array.slice(size), size),
						  ]
						: [array];
				}

				const allOutput = require(outputFileUrlWithAmbiguousStressHandled);

				const batches = splitArrayIntoBatches(allOutput, batchSize);

				batches.forEach((batch, index) => {
					console.debug('Creating batch… ', index);
					const batchUrl =
						getOutputFileUrlForBatchAfterHandingAmbiguousStress(index);
					batchFilepaths.push(batchUrl);

					const batchAsObject = {};
					batch.forEach((lemma) => (batchAsObject[lemma.Lemma] = lemma.Forms));

					fs.writeFileSync(batchUrl, JSON.stringify(batchAsObject, null, '\t'));
				});

				// const combinedOutput = {};
				// batchFilepaths.forEach((filename) => {
				// 	const outputBatch = require(filename);
				// 	Object.entries(outputBatch).forEach(
				// 		([lemma, parsingData]) => (combinedOutput[lemma] = parsingData),
				// 	);
				// });
				// fs.writeFileSync(outputFileUrl, JSON.stringify(combinedOutput));
				console.timeEnd('divideIntoBatches');
			}

			function mergeWithLemmataJson() {
				console.time('mergeWithLemmataJson');

				const combinedLemmataDataAsObject = {};

				countNotChecked = 0;
				const PART_OF_SPEECH_TO_LOG = 'Verb';
				let lemmataOfSamePartOfSpeech = '';

				//// Add data from input lemmata data.
				inputLemmata.forEach((lemmaObject, index) => {
					//// Ignore duplicate lemmata.
					if (combinedLemmataDataAsObject[lemmaObject.Lemma]) {
						console.warn(
							'Combined lemma data already has ' + lemmaObject.Lemma,
						);
					} else {
						const {
							Lemma,
							PartOfSpeech,
							Meanings,
							Notes,
							Transliterations,
							Root,
						} = lemmaObject;
						const Index = index;
						// The velut website uses NoMacra & NoMacraLowerCase when sorting lemmata.
						const NoTypeTag = removeBrackets(Lemma);
						const NoMacra = removeDiacritics(NoTypeTag);
						const NoMacraLowerCase = NoMacra.toLowerCase();

						combinedLemmataDataAsObject[lemmaObject.Lemma] = {
							Index,
							Lemma,
							PartOfSpeech,
							Meanings,
							Notes,
							Transliterations,
							Root,
							NoMacra,
							NoMacraLowerCase,
						};

						if (lemmaObject['20230721']) {
							countNotChecked++;
							if (PartOfSpeech === PART_OF_SPEECH_TO_LOG) {
								lemmataOfSamePartOfSpeech += ' ' + NoTypeTag;
							}
						}
					}
				});

				console.log(
					`There are ${countNotChecked} lemmata whose forms should be checked manually.`,
				);

				//// Add data from output of inflector to a "Forms" field in each lemma.
				//// (This overrides any "Forms" field the lemma already has.)
				batchFilepaths.forEach((filename) => {
					const outputBatch = require(filename);
					const outputEntries = Object.entries(outputBatch);

					for ([lemma, parsingData] of outputEntries) {
						combinedLemmataDataAsObject[lemma].Forms = parsingData;
					}
				});

				let combinedLemmataDataForMongo = '';

				//// Convert to the format for mongoimport, so [{},{}] becomes {}{}
				Object.entries(combinedLemmataDataAsObject).forEach(
					([_, lemmaObject]) => {
						//// The \n isn’t necessary but I like it.
						combinedLemmataDataForMongo += JSON.stringify(lemmaObject) + '\n';
					},
				);

				//// Write to disk.
				fs.writeFileSync(combinedOutputFileUrl, combinedLemmataDataForMongo);

				console.timeEnd('mergeWithLemmataJson');
			}

			function checkAgainstExpected() {
				console.time('checkingOutput');

				successCount = 0;
				errorCount = 0;
				noTestDataCount = 0;
				totalLemmata = 0;
				// const output = require(outputFileUrl);
				const expectedOutput = require(expectedOutputFileUrl);

				// const totalLemmata = outputEntries.length;
				batchFilepaths.forEach((filename) => {
					const outputBatch = require(filename);
					const outputEntries = Object.entries(outputBatch);

					for ([lemma, parsingData] of outputEntries) {
						totalLemmata++;

						if (!parsingData) {
							//// parsingData should be an object, which is always truthy.
							//// (Even an empty object is truthy.)
							//// So entering this branch would be strange.
							console.debug(lemma);
							continue;
						}
						if (Object.keys(parsingData).length === 0) {
							//// The Inflector returns {} for lemmata it doesn’t know
							//// how to inflect, so there are no forms to compare here.
							//// These lemmata will be counted as “skipped”.
							const unprefixed = lemma.replace(
								/^(abs(?=c)|ab|af(?=f)|ad|al(?=l)|ante|ap(?=p)|ar(?=r)|as(?=s)|at(?=t)|circum|col(?=f)|com(?=[mp])|contrā|con|cōn(?=[fs])|cor(?=r)|dē|dī(?=[mrv])|dif(?=f)|dis|ē|ex|il(?=l)|im(?=[mp])|inter|intrō|in|īn(?=[fs])|ob|oc(?=c)|of(?=f)|op(?=p)|pel(?=l)|per|praeter|prae|prō|re|sē|subter|sub|suc(?=c)|suf(?=f)|super|sur(?=r)|trāns|.+)/,
								'',
							);

							const guessConjugationFromExistingForms = (
								lemmaToTest,
								shouldLog = true,
							) => {
								if (!expectedOutput[lemmaToTest]) {
									return;
								}

								const lemmasExpectedOutput = [...expectedOutput[lemmaToTest]];
								// console.debug(lemma);
								let didIfStatementsMatch = true;
								if (lemmasExpectedOutput.some((form) => form.endsWith('āns'))) {
									shouldLog &&
										console.log('Possible first conjugation: ', lemma);
								} else if (
									/iō(\[[^\]]+\])?$/.test(lemmaToTest) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('ere')) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('faciō'))
								) {
									shouldLog &&
										console.log('Possible fourth conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest]);
								} else if (
									/eō(\[[^\]]+\])?$/.test(lemmaToTest) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('īre')) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('iēns'))
								) {
									shouldLog &&
										console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest]);
								} else if (
									/(?<!grad|gred|mor)ior(\[[^\]]+\])?$/.test(lemmaToTest) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('ere')) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('iāns'))
								) {
									shouldLog &&
										console.log('Possible fourth conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest]);
								} else if (
									/eō(\[[^\]]+\])?$/.test(lemmaToTest) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('īre')) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('iēns'))
								) {
									shouldLog &&
										console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest]);
								} else if (
									/eor(\[[^\]]+\])?$/.test(lemmaToTest) &&
									lemmasExpectedOutput.every((form) => !form.endsWith('iēns'))
								) {
									shouldLog &&
										console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest]);
								} else if (
									lemmasExpectedOutput.some((form) => form.endsWith('ere'))
								) {
									shouldLog &&
										console.log('Possible third conjugation: ', lemma);
								} else {
									didIfStatementsMatch = false;
								}
								return didIfStatementsMatch;
							};

							if (/(cipiō|cutiō|fugiō|ripiō|iciō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (-iō): ', lemma);
							} else if (guessConjugationFromExistingForms(lemma, false)) {
								// Do nothing.
							} else if (/or(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Deponent: ', lemma);
							} else if (/(āscō|ēscō|īscō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (inchoative): ', lemma);
							} else if (/(faciō|ficiō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (faciō): ', lemma);
							} else if (/(ferō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible irregular (ferō): ', lemma);
							} else if (/(eō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible irregular (eō): ', lemma);
							} else if (/āre\]$/.test(lemma)) {
								// console.log('Possible first conjugation: ', lemma);
							} else if (/ēre\]$/.test(lemma)) {
								// console.log('Possible second conjugation: ', lemma);
							} else if (/ere\]$/.test(lemma)) {
								// 	console.log('Possible third conjugation: ', lemma);
							} else if (/īre\]$/.test(lemma)) {
								// console.log('Possible fourth conjugation: ', lemma);
							} else if (/(at)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible first conjugation impersonal: ', lemma);
							} else if (/(et)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible second conjugation impersonal: ', lemma);
							} else if (/(it)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation impersonal: ', lemma);
							} else if (
								unprefixed &&
								guessConjugationFromExistingForms(unprefixed, false)
							) {
								// Do nothing
							} else if (
								/(aggerō|aliēnō|colōrō|culcō|ficō|fōcō|fortō|frēnō|frūstrō|lārvō|līberō|ligō|mūtō|plōrō|pūstulō|turbō)(\[[^\]]+\])?$/.test(
									lemma,
								)
							) {
								// console.log('Possible first conjugation: ', lemma);
								// console.log(expectedOutput[lemma])
							} else if (/(ō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation: ', lemma);
								// console.log(expectedOutput[lemma])
							} else if (
								![
									'rēfert',
									'inquam',
									'coepī',
									'meminī',
									'ōdī',
									'potin',
									'laecasīn',
									'cum[v]',
								].includes(lemma)
							) {
								console.log('Might not be a verb: ', lemma);
							} else {
								// console.log('Unknown conjugation: ', lemma);
							}
							continue;
						}

						if (expectedOutput[lemma] === undefined) {
							console.warn('No expected output for ' + lemma);
							noTestDataCount++;
							continue;
						}

						const formsAsSet = convertParsingObjectToFormsSet(parsingData);
						const expectedFormsAsSet = convertParsingObjectToFormsSet(
							expectedOutput[lemma],
						);

						if (isSuperset(formsAsSet, expectedFormsAsSet)) {
							successCount++;
							// console.log('Yay! ' + lemma);
							// if (!isEqualSet(formsAsSet, expectedFormsAsSet)) {
							// 	console.log({
							// 		missingFromExcel: subtractSet(formsAsSet, expectedFormsAsSet),
							// 		for: lemma,
							// 	});
							// }
							// const parsingDataAsJson = JSON.stringify(parsingData)
							// console.log({parsingDataAsJson})
						} else {
							errorCount++;
							console.error({
								expected: expectedFormsAsSet,
								// actual: formsAsSet,
								missing: subtractSet(expectedFormsAsSet, formsAsSet),
								for: lemma,
							});
							// console.error(lemma)
							// console.error(subtractSet(expectedFormsAsSet, formsAsSet));
						}

						//// If I had added incorrect forms to velut in Excel,
						//// I’ve used the ExtraEncliticizedForms field in the input Json
						//// to add an "incorrect" array of those forms to the output object.
						//// This is to ensure that all forms that were in Excel are
						//// output by the Inflector, while also ensuring incorrect forms
						//// can be easily filtered out.
						//// The following if/else-block tests whether these forms appear
						//// elsewhere in the output object — they shouldn’t.
						if (parsingData.incorrect) {
							const incorrectFormsSet = convertParsingObjectToFormsSet(
								parsingData.incorrect,
							);
							delete parsingData.incorrect;
							const correctFormsSet =
								convertParsingObjectToFormsSet(parsingData);
							const formsBothCorrectAndNotIncorrect = subtractSet(
								correctFormsSet,
								incorrectFormsSet,
							);
							if (
								isEqualSet(correctFormsSet, formsBothCorrectAndNotIncorrect)
							) {
								// console.log("Success — no incorrect forms are considered correct for " + lemma);
							} else {
								const formsBothCorrectAndIncorrect = subtractSet(
									correctFormsSet,
									formsBothCorrectAndNotIncorrect,
								);
								console.warn(
									'Warning — incorrect forms are considered correct for ' +
										lemma,
								);
								console.debug(formsBothCorrectAndIncorrect);
								consoleLogAsJson(parsingData);
							}
						}
					}
				});
				skippedCount =
					totalLemmata - errorCount - successCount - noTestDataCount;
				console.warn(
					`There were ${errorCount} mismatches (and ${successCount} successes, ${skippedCount} skipped, and ${noTestDataCount} with no existing forms data to compare) out of ${totalLemmata} lemmata.`,
				);

				console.timeEnd('checkingOutput');

				// Loop over the output forms objects (again), this time looking for properties that won’t display on the velut website.
				// (The website won’t display any verb forms other than a set list of parsings.
				// Forms of non-verbs don’t need to be checked here because the website displays them separately.)
				console.time('checkingVerbFormTags');

				batchFilepaths.forEach((filename) => {
					const outputBatch = require(filename);
					const outputEntries = Object.entries(outputBatch);

					for ([lemma, parsingData] of outputEntries) {
						if (!parsingData) {
							console.debug({ lemma, parsingData });
						}
						checkVerbFormTags(parsingData);
					}
				});

				console.timeEnd('checkingVerbFormTags');
			}

			// This function receives a verb’s Forms output and checks that it doesn’t contain any fields that won’t display on the velut website.
			// Eg formsData.unencliticized.supine.ablative is okay, but formsData.unencliticized.supine.dative is not — dative supines don’t exist.
			// (Only `unencliticized` fields are checked.)
			function checkVerbFormTags(formsData) {
				if (!formsData) {
					console.debug({ formsData });
					return;
				}
				if (!formsData.unencliticized) {
					return;
				}
				// Skip if the forms object is not a verb’s.
				if (
					!formsData.unencliticized.indicative &&
					!formsData.unencliticized.subjunctive &&
					!formsData.unencliticized.imperative &&
					!formsData.unencliticized.infinitive &&
					!formsData.unencliticized.participle &&
					!formsData.unencliticized.gerund &&
					!formsData.unencliticized.supine
				) {
					return;
				}

				// This should match the tags used in <VerbDataCell> on the velut website.
				const classNames = [
					'indicative active present singular first',
					'indicative active present singular second',
					'indicative active present singular third',
					'indicative active present plural first',
					'indicative active present plural second',
					'indicative active present plural third',
					'indicative active imperfect singular first',
					'indicative active imperfect singular second',
					'indicative active imperfect singular third',
					'indicative active imperfect plural first',
					'indicative active imperfect plural second',
					'indicative active imperfect plural third',
					'indicative active future singular first',
					'indicative active future singular second',
					'indicative active future singular third',
					'indicative active future plural first',
					'indicative active future plural second',
					'indicative active future plural third',
					'indicative active perfect singular first',
					'indicative active perfect singular second',
					'indicative active perfect singular third',
					'indicative active perfect plural first',
					'indicative active perfect plural second',
					'indicative active perfect plural third',
					'indicative active pluperfect singular first',
					'indicative active pluperfect singular second',
					'indicative active pluperfect singular third',
					'indicative active pluperfect plural first',
					'indicative active pluperfect plural second',
					'indicative active pluperfect plural third',
					'indicative active futureperfect singular first',
					'indicative active futureperfect singular second',
					'indicative active futureperfect singular third',
					'indicative active futureperfect plural first',
					'indicative active futureperfect plural second',
					'indicative active futureperfect plural third',
					'indicative passive present singular first',
					'indicative passive present singular second',
					'indicative passive present singular third',
					'indicative passive present plural first',
					'indicative passive present plural second',
					'indicative passive present plural third',
					'indicative passive imperfect singular first',
					'indicative passive imperfect singular second',
					'indicative passive imperfect singular third',
					'indicative passive imperfect plural first',
					'indicative passive imperfect plural second',
					'indicative passive imperfect plural third',
					'indicative passive future singular first',
					'indicative passive future singular second',
					'indicative passive future singular third',
					'indicative passive future plural first',
					'indicative passive future plural second',
					'indicative passive future plural third',
					'subjunctive active present singular first',
					'subjunctive active present singular second',
					'subjunctive active present singular third',
					'subjunctive active present plural first',
					'subjunctive active present plural second',
					'subjunctive active present plural third',
					'subjunctive active imperfect singular first',
					'subjunctive active imperfect singular second',
					'subjunctive active imperfect singular third',
					'subjunctive active imperfect plural first',
					'subjunctive active imperfect plural second',
					'subjunctive active imperfect plural third',
					'subjunctive active perfect singular first',
					'subjunctive active perfect singular second',
					'subjunctive active perfect singular third',
					'subjunctive active perfect plural first',
					'subjunctive active perfect plural second',
					'subjunctive active perfect plural third',
					'subjunctive active pluperfect singular first',
					'subjunctive active pluperfect singular second',
					'subjunctive active pluperfect singular third',
					'subjunctive active pluperfect plural first',
					'subjunctive active pluperfect plural second',
					'subjunctive active pluperfect plural third',
					'subjunctive passive present singular first',
					'subjunctive passive present singular second',
					'subjunctive passive present singular third',
					'subjunctive passive present plural first',
					'subjunctive passive present plural second',
					'subjunctive passive present plural third',
					'subjunctive passive imperfect singular first',
					'subjunctive passive imperfect singular second',
					'subjunctive passive imperfect singular third',
					'subjunctive passive imperfect plural first',
					'subjunctive passive imperfect plural second',
					'subjunctive passive imperfect plural third',
					'imperative active present singular second',
					'imperative active present singular third',
					'imperative active present plural second',
					'imperative active present plural third',
					'imperative active future singular second',
					'imperative active future singular third',
					'imperative active future plural second',
					'imperative active future plural third',
					'imperative passive present singular second',
					'imperative passive present singular third',
					'imperative passive present plural second',
					'imperative passive present plural third',
					'imperative passive future singular second',
					'imperative passive future singular third',
					'imperative passive future plural second',
					'imperative passive future plural third',
					'infinitive active present',
					'infinitive active perfect',
					'infinitive active future',
					'infinitive passive present',
					'gerund accusative',
					'gerund genitive',
					'gerund dative',
					'gerund ablative',
					'supine accusative',
					'supine ablative',
					'participle active present masculine singular nominative',
					'participle active present masculine singular vocative',
					'participle active present masculine singular accusative',
					'participle active present masculine singular genitive',
					'participle active present masculine singular dative',
					'participle active present masculine singular ablative',
					'participle active present masculine plural nominative',
					'participle active present masculine plural vocative',
					'participle active present masculine plural accusative',
					'participle active present masculine plural genitive',
					'participle active present masculine plural dative',
					'participle active present masculine plural ablative',
					'participle active present feminine singular nominative',
					'participle active present feminine singular vocative',
					'participle active present feminine singular accusative',
					'participle active present feminine singular genitive',
					'participle active present feminine singular dative',
					'participle active present feminine singular ablative',
					'participle active present feminine plural nominative',
					'participle active present feminine plural vocative',
					'participle active present feminine plural accusative',
					'participle active present feminine plural genitive',
					'participle active present feminine plural dative',
					'participle active present feminine plural ablative',
					'participle active present neuter singular nominative',
					'participle active present neuter singular vocative',
					'participle active present neuter singular accusative',
					'participle active present neuter singular genitive',
					'participle active present neuter singular dative',
					'participle active present neuter singular ablative',
					'participle active present neuter plural nominative',
					'participle active present neuter plural vocative',
					'participle active present neuter plural accusative',
					'participle active present neuter plural genitive',
					'participle active present neuter plural dative',
					'participle active present neuter plural ablative',
					'participle active perfect masculine singular nominative',
					'participle active perfect masculine singular vocative',
					'participle active perfect masculine singular accusative',
					'participle active perfect masculine singular genitive',
					'participle active perfect masculine singular dative',
					'participle active perfect masculine singular ablative',
					'participle active perfect masculine plural nominative',
					'participle active perfect masculine plural vocative',
					'participle active perfect masculine plural accusative',
					'participle active perfect masculine plural genitive',
					'participle active perfect masculine plural dative',
					'participle active perfect masculine plural ablative',
					'participle active perfect feminine singular nominative',
					'participle active perfect feminine singular vocative',
					'participle active perfect feminine singular accusative',
					'participle active perfect feminine singular genitive',
					'participle active perfect feminine singular dative',
					'participle active perfect feminine singular ablative',
					'participle active perfect feminine plural nominative',
					'participle active perfect feminine plural vocative',
					'participle active perfect feminine plural accusative',
					'participle active perfect feminine plural genitive',
					'participle active perfect feminine plural dative',
					'participle active perfect feminine plural ablative',
					'participle active perfect neuter singular nominative',
					'participle active perfect neuter singular vocative',
					'participle active perfect neuter singular accusative',
					'participle active perfect neuter singular genitive',
					'participle active perfect neuter singular dative',
					'participle active perfect neuter singular ablative',
					'participle active perfect neuter plural nominative',
					'participle active perfect neuter plural vocative',
					'participle active perfect neuter plural accusative',
					'participle active perfect neuter plural genitive',
					'participle active perfect neuter plural dative',
					'participle active perfect neuter plural ablative',
					'participle active future masculine singular nominative',
					'participle active future masculine singular vocative',
					'participle active future masculine singular accusative',
					'participle active future masculine singular genitive',
					'participle active future masculine singular dative',
					'participle active future masculine singular ablative',
					'participle active future masculine plural nominative',
					'participle active future masculine plural vocative',
					'participle active future masculine plural accusative',
					'participle active future masculine plural genitive',
					'participle active future masculine plural dative',
					'participle active future masculine plural ablative',
					'participle active future feminine singular nominative',
					'participle active future feminine singular vocative',
					'participle active future feminine singular accusative',
					'participle active future feminine singular genitive',
					'participle active future feminine singular dative',
					'participle active future feminine singular ablative',
					'participle active future feminine plural nominative',
					'participle active future feminine plural vocative',
					'participle active future feminine plural accusative',
					'participle active future feminine plural genitive',
					'participle active future feminine plural dative',
					'participle active future feminine plural ablative',
					'participle active future neuter singular nominative',
					'participle active future neuter singular vocative',
					'participle active future neuter singular accusative',
					'participle active future neuter singular genitive',
					'participle active future neuter singular dative',
					'participle active future neuter singular ablative',
					'participle active future neuter plural nominative',
					'participle active future neuter plural vocative',
					'participle active future neuter plural accusative',
					'participle active future neuter plural genitive',
					'participle active future neuter plural dative',
					'participle active future neuter plural ablative',
					'participle passive perfect masculine singular nominative',
					'participle passive perfect masculine singular vocative',
					'participle passive perfect masculine singular accusative',
					'participle passive perfect masculine singular genitive',
					'participle passive perfect masculine singular dative',
					'participle passive perfect masculine singular ablative',
					'participle passive perfect masculine plural nominative',
					'participle passive perfect masculine plural vocative',
					'participle passive perfect masculine plural accusative',
					'participle passive perfect masculine plural genitive',
					'participle passive perfect masculine plural dative',
					'participle passive perfect masculine plural ablative',
					'participle passive perfect feminine singular nominative',
					'participle passive perfect feminine singular vocative',
					'participle passive perfect feminine singular accusative',
					'participle passive perfect feminine singular genitive',
					'participle passive perfect feminine singular dative',
					'participle passive perfect feminine singular ablative',
					'participle passive perfect feminine plural nominative',
					'participle passive perfect feminine plural vocative',
					'participle passive perfect feminine plural accusative',
					'participle passive perfect feminine plural genitive',
					'participle passive perfect feminine plural dative',
					'participle passive perfect feminine plural ablative',
					'participle passive perfect neuter singular nominative',
					'participle passive perfect neuter singular vocative',
					'participle passive perfect neuter singular accusative',
					'participle passive perfect neuter singular genitive',
					'participle passive perfect neuter singular dative',
					'participle passive perfect neuter singular ablative',
					'participle passive perfect neuter plural nominative',
					'participle passive perfect neuter plural vocative',
					'participle passive perfect neuter plural accusative',
					'participle passive perfect neuter plural genitive',
					'participle passive perfect neuter plural dative',
					'participle passive perfect neuter plural ablative',
					'participle passive future masculine singular nominative',
					'participle passive future masculine singular vocative',
					'participle passive future masculine singular accusative',
					'participle passive future masculine singular genitive',
					'participle passive future masculine singular dative',
					'participle passive future masculine singular ablative',
					'participle passive future masculine plural nominative',
					'participle passive future masculine plural vocative',
					'participle passive future masculine plural accusative',
					'participle passive future masculine plural genitive',
					'participle passive future masculine plural dative',
					'participle passive future masculine plural ablative',
					'participle passive future feminine singular nominative',
					'participle passive future feminine singular vocative',
					'participle passive future feminine singular accusative',
					'participle passive future feminine singular genitive',
					'participle passive future feminine singular dative',
					'participle passive future feminine singular ablative',
					'participle passive future feminine plural nominative',
					'participle passive future feminine plural vocative',
					'participle passive future feminine plural accusative',
					'participle passive future feminine plural genitive',
					'participle passive future feminine plural dative',
					'participle passive future feminine plural ablative',
					'participle passive future neuter singular nominative',
					'participle passive future neuter singular vocative',
					'participle passive future neuter singular accusative',
					'participle passive future neuter singular genitive',
					'participle passive future neuter singular dative',
					'participle passive future neuter singular ablative',
					'participle passive future neuter plural nominative',
					'participle passive future neuter plural vocative',
					'participle passive future neuter plural accusative',
					'participle passive future neuter plural genitive',
					'participle passive future neuter plural dative',
					'participle passive future neuter plural ablative',
				];

				let forms = structuredClone(formsData.unencliticized);

				// Recursive function for following the keys in an array to nullify a key in the object.
				// Eg if the array is ['infinitive','active','present']
				// formsObject.infinitive.active.present will be set to null.
				// The `deleteEmptyForms` function will then delete all the null and empty-object properties.
				function deleteForm(formsObject, keysArray) {
					if (keysArray.length === 1) {
						formsObject[keysArray[0]] = null;
						return;
					}
					if (formsObject[keysArray[0]]) {
						deleteForm(formsObject[keysArray[0]], keysArray.slice(1));
					}
				}

				classNames.forEach((className) => {
					const classesArray = className.split(' ');
					deleteForm(forms, classesArray);
				});

				forms = deleteEmptyFields(forms);

				// After deleting all the expected forms, the object should be empty.
				// If it isn’t, we should see what’s left in it.
				// A future subjunctive? An imperfect imperative? Something even weirder?
				if (JSON.stringify(forms) !== '{}') {
					consoleLogAsJson(forms);
				}
			}

			function generateSummaryFile() {
				console.time('generatingSummaryFile');

				const lastUpdatedDate = new Date().toISOString();

				const inflectorCounts = {
					mismatches: errorCount,
					successes: successCount,
					inflectFuncNotDefined: skippedCount,
					noTestData: noTestDataCount,
					total: totalLemmata,
					toBeManuallyChecked: countNotChecked,
					manuallyChecked: totalLemmata - countNotChecked,
				};

				const errata = inputLemmata
					.filter(
						(lemmaObject) =>
							lemmaObject.ExtraEncliticizedForms?.incorrect?.length,
					)
					.map((lemmaObject) => {
						return {
							lemma: lemmaObject.Lemma,
							incorrectForms: lemmaObject.ExtraEncliticizedForms?.incorrect,
						};
					})
					.sort((a, b) => {
						const aNoTypeTag = removeBrackets(a.lemma);
						const aNoMacra = removeDiacritics(aNoTypeTag);
						const aNoMacraLowerCase = aNoMacra.toLowerCase();
						const bNoTypeTag = removeBrackets(b.lemma);
						const bNoMacra = removeDiacritics(bNoTypeTag);
						const bNoMacraLowerCase = bNoMacra.toLowerCase();

						if (aNoMacraLowerCase > bNoMacraLowerCase) {
							return 1;
						}
						if (aNoMacraLowerCase < bNoMacraLowerCase) {
							return -1;
						}
						if (aNoMacra > bNoMacra) {
							return 1;
						}
						if (aNoMacra < bNoMacra) {
							return -1;
						}
						if (aNoTypeTag > bNoTypeTag) {
							return 1;
						}
						if (aNoTypeTag < bNoTypeTag) {
							return -1;
						}
						if (a.lemma > b.lemma) {
							return 1;
						}
						if (a.lemma < b.lemma) {
							return -1;
						}
						return 0;
					});

				//// Fields are camel-cased in the `summary` MongoDB collection.
				const summaryObject = {
					lastUpdatedDate,
					inflectorCounts,
					errata,
				};

				fs.writeFileSync(
					summaryFileUrl,
					JSON.stringify(summaryObject, null, 2) + '\n',
				);

				console.timeEnd('generatingSummaryFile');
			}

			generateOutput();
			replaceFormsOfAmbiguousStress();
			divideIntoBatches();
			mergeWithLemmataJson();
			checkAgainstExpected();
			generateSummaryFile();
		} catch (err) {
			console.error(err);
		}
	}

	runAllWords();
}
