#!/usr/bin/env node

const filesystem = require('fs');
const { blue, green, red, yellow, cyan, magenta } = require('chalk');
const stdin = process.openStdin();

const ARGUMENT_ERROR = red('\nMust supply piped text input. Example:\n ') + magenta(`ag 'React.' -Q | `) + cyan(`js-method-syntax-tree 'React'\n`);

if (process.argv.length < 3) {
    console.error(ARGUMENT_ERROR);
    process.exit(1);
}

// Input that is piped from terminal (preferably ag)
let terminalInput = '';
// Argument passed in from the command line
let libraryName = process.argv[2];
// Dynamic regexp and string for matching
const libraryString = libraryName + '.';
const libraryRegexp = new RegExp(libraryString + '*;+', 'g');


const parseTerminalInput = () => {
    console.log(`\n  Searching directory for regexp: ${yellow(libraryRegexp)}\n`);

    const libraryStrings = terminalInput.match(libraryRegexp);
    console.log(`  Found ${blue(libraryStrings.length)} matches`);

    const uniqueStrings = [...new Set(libraryStrings)];
    console.log(`  Found ${blue(uniqueStrings.length)} unique strings`);

    const methodStringArrays = uniqueStrings.map(methodString => parseMethodString(methodString));
    const uniqueMethodStringArrays = methodStringArrays.filter(uniqueArrayFilter);
    console.log(`  Found ${blue(uniqueMethodStringArrays.length)} unique method calls\n`);

    const nestedMethodStringArrays = uniqueMethodStringArrays.map(uniqueParsedString => parseNestedMethodString(uniqueParsedString));
    console.log(`  Parsed nested method calls`);

    let flattenedMethodStringArrays = [];
    nestedMethodStringArrays.forEach(methodStringArray => {
        if (typeof methodStringArray[0] === 'string') {
            flattenedMethodStringArrays.push(methodStringArray);
        }
        else if (typeof methodStringArray[0] === 'object') {
            methodStringArray.map(innerMethodStringArray => flattenedMethodStringArrays.push(innerMethodStringArray));
        }
    });
    console.log(`  Flattened nested objects`);

    // Remove libraryString from the 0th index of all methodStringArrays
    flattenedMethodStringArrays = flattenedMethodStringArrays.map(methodStringArray => methodStringArray.slice(1));

    const coreMethodTree = {};
    flattenedMethodStringArrays.forEach(methodStringArray => {
        let indexedReference = coreMethodTree;
        methodStringArray.forEach(methodString => {
            if (!indexedReference.hasOwnProperty(methodString)) {
                indexedReference[methodString] = {};
            }
            indexedReference = indexedReference[methodString];
        });
    });
    console.log(`  Built method tree`);

    const methodCount = countUniqueProperties(coreMethodTree);
    console.log(`  Found ${methodCount} unique methods\n`);

    const logfileName = '../logfile.json';
    filesystem.writeFile(logfileName, JSON.stringify({[libraryString]: coreMethodTree}, null, 4), 'utf8', error => error ? console.error(error) : undefined);
    console.log(`  ${green('COMPLETE:')} Wrote method tree to ${green(logfileName)}\n`);
}

// Recursive function for parsing a chained call into individual objects/methods
const parseMethodString = (methodString, previousMatches) => {
    let matches = previousMatches || [];
    const matchesLength = matches.length;
    const methodRegexp = matchesLength && matches[matchesLength - 1] === libraryString ? /^[0-9a-zA-Z]+[\.\(\);]/ : /^[0-9a-zA-Z]+[\.\(;]/;
    const match = methodString.match(methodRegexp);
    if (!match) return matches;
    matches.push(match[0]);
    methodString = methodString.replace(methodRegexp, '');
    return match ? parseMethodString(methodString, matches) : matches;
}

// Recursive function for parsing nested library calls into individual arrays
const parseNestedMethodString = (methodStringArray, previousArrays) => {
    let arrayMatches = previousArrays || [];
    const secondInstanceStartIndex = methodStringArray.indexOf(libraryString, 1);
    if (secondInstanceStartIndex === -1) return methodStringArray;
    let secondInstanceStopIndex = methodStringArray.indexOf(libraryString, secondInstanceStartIndex + 1);
    if (secondInstanceStopIndex === -1) secondInstanceStopIndex = methodStringArray.length - 1;
    const nextMethodStringArray = methodStringArray.splice(secondInstanceStartIndex, secondInstanceStopIndex);
    arrayMatches.push(methodStringArray);
    if (nextMethodStringArray.indexOf(libraryString, 1) === -1) {
        arrayMatches.push(nextMethodStringArray);
        return arrayMatches;
    }
    else {
        return parseNestedMethodString(nextMethodStringArray, arrayMatches);
    }
}

// Recursive method for counting the total number of nested properties in an object
const countUniqueProperties = (object, runningCount) => {
    let count = runningCount || 0;
    Object.keys(object).forEach(property => count = countUniqueProperties(object[property], ++count));
    return count;
}

// Expression that can be passed to Array.filter to remove duplicate child arrays (non-recursive)
const uniqueArrayFilter = (array = {}, element => !(array[element] = element in array));

stdin.on('data', chunk => terminalInput += chunk);
stdin.on('end', () => {
    if (terminalInput === '') {
        console.error(ARGUMENT_ERROR);
        process.exit(1);
    }
    else {
        parseTerminalInput();
    }
});

setTimeout(() => {
    if (terminalInput === '') {
        console.error(ARGUMENT_ERROR);
        process.exit(1);
    }
}, 500);