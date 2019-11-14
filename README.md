## @intouchgroup/js-method-syntax-tree

CLI to generate a syntax tree for JavaScript methods


### Installation

Install this package via npm:
```
npm i -g @intouchgroup/js-method-syntax-tree
```


### Usage

Pipe text content into this script (such as a JS file), and pass it a search string (such as library name):
```
ag 'React.' -Q | js-method-syntax-tree 'React'
```