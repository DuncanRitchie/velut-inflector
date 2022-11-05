# Inflector for velut

https://www.duncanritchie.co.uk/velut-inflector/

This generates words for my Latin rhyming dictionary, [velut](https://github.com/DuncanRitchie/velut) by applying inflection rules to lemmata data.
The resultant Json can be downloaded or copied to the clipboard.

It has a webpage for a user-interface for demo purposes.
When I refresh all the “words” data in velut, I run inflector.js in Node.
This contains hardcoded filepaths to read input data from and write output data to.

_If you’re not me, you’re unlikely to have much use for the Inflector._

## Input & output

The input must be a Json array of objects with `Lemma`, `PartOfSpeech` (etc) properties.
For example:

```json
[
  {
    "Lemma": "industrius",
    "PartOfSpeech": "Adjective",
    "ComparativeStems": ["industr"],
    "ParsingsToExclude": ["superlative"]
  }
]
```

There is a “Load sample” button to give you more examples.

See the webpage for the [list of fields in the input](](https://www.duncanritchie.co.uk/velut-inflector#input-format)) and an example of the [full object generated for an adjective](https://www.duncanritchie.co.uk/velut-inflector#forms-objects).
The latter is very long because I generate encliticized forms (ending in -ne, -que, and -ve) as well as unencliticized.

## Context

The velut website uses a MongoDB database, and the Inflector produces Json data that will ultimately go into the MongoDB database.
I privately have a large Excel file for generating and storing the data in velut.
Excel was what I knew when I first got interested in coding, but it’s far from ideal for this sort of thing.
I have a long-term project of converting my Excel file into websites and webpages that are easier to share and maintain.
I’m very much in a transition period of using the Excel file for some things and my newer websites/webpages for others.
But the Inflector is another step in the process.

For more information, see the [About section](https://www.duncanritchie.co.uk/velut-inflector/#about) of the webpage.

## Quick links

- [velut website](https://www.velut.co.uk)
- [My personal website](https://www.duncanritchie.co.uk)
