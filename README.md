# Inflector for velut

https://www.duncanritchie.co.uk/velut-inflector/

This generates words for my Latin rhyming dictionary, [velut](https://github.com/DuncanRitchie/velut), by applying inflection rules to lemmata data.
The resultant Json can be downloaded or copied to the clipboard.

It has a webpage for a user-interface for demo purposes.
But when I want to refresh all the data in velut, I run inflector.js in Node.
This contains hardcoded filepaths to read input data from and write output data to.
I then am able to do further processing on the output.

_If you’re not me, you’re unlikely to have much use for the Inflector._

For more information, see the [About section](https://www.duncanritchie.co.uk/velut-inflector/#about) of the webpage.

## Input & output

The input must be a Json array of objects with `Lemma` and `PartOfSpeech` properties.
Some lemmata will need extra fields for the Inflector to yield the correct inflections.
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

See the webpage for the [list of fields in the input](https://www.duncanritchie.co.uk/velut-inflector#input-format) and an example of the [full object generated for an adjective](https://www.duncanritchie.co.uk/velut-inflector#forms-objects).
The latter is very long because I generate encliticized forms (ending in -ne, -que, and -ve) as well as unencliticized.

## Context

The velut website uses a MongoDB database, and the Inflector produces Json data that will ultimately go into the MongoDB database.
I privately have a large Excel file that I used for generating and storing the data in velut.
Excel was what I knew when I first got interested in coding, but it’s far from ideal for this sort of thing.
I’ve been converting my Excel file into websites and webpages that are easier to share and maintain.
The Inflector is a step in this process.

Another benefit of the Inflector is that it generates grammatical data that I couldn’t feasibly put in Excel, including many inflected forms and all the parsings for the forms.
When you see tables of forms on the velut website, that information is coming from the Inflector.

Likewise, when you see a page on velut for a specific word, or you see a word listed among a set of rhymes (etc), that word is one of the many words generated as inflected forms by the Inflector. 

![Forms for the verb amō as shown on the website](https://www.duncanritchie.co.uk/blog/images/2024/verb-table-amo-without-background.webp)

For the checklist of work needed for me to get rid of the Excel file, including work on the Inflector, see my [plan for the de-Excellation of velut](https://github.com/DuncanRitchie/velut/blob/main/plan.md).

## Quick links

- [velut website](https://www.velut.co.uk)
- [My personal website](https://www.duncanritchie.co.uk)
