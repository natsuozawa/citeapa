# Cite APA Documentation

Create a citation referencing a work to include in the **references** section of an essay in **APA style**.

For more information about this software, see [README.md](./README.md)

To start the program, click [here](https://citeapa.js.org).

**This is the technical documentation of the program, for further development and debugging. For practical use, please see [README.md](./README.md)**

## Directories and files
```
| Cite APA
  | .git [invisible] (contains git information)
  | lib (contains source files of program)
    - app.css (compiled output of app.scss)
    - app.js
    - app.min.js (minifed app.js)
    - app.scss 
  | source
    - jquery.min.js
  | thumbnail
    - back.svg (icon)
    - background1.png (background)
    - background2.png (background)
    - background3.png (background)
    - background4.png (background)
    - background5.png (background)
    - background6.png (background)
    - background7.png (background)
    - book.svg (icon)
    - close.svg (icon)
    - forward.svg (icon)
    - hint.svg (icon)
    - journal.svg (icon)
    - logo.png (page icon)
    - menu.svg
    - minus.svg (icon)
    - plus.svg (icon)
    - reload.svg (icon)
    - webpage.svg (icon)
  - .gitignore
  - changelog.txt
  - CNAME
  - documentation.md [THIS FILE]
  - LICENSE
  - README.md
```

## Documentation
This application uses `HTML` / `CSS (SCSS)` / `JavaScript (ES6, jQuery)`.

### UI
The application has a simplistic UI that goes through each step for the user to enter information. Every page is a `page` class HTML div, which is controlled by `app.js`.

#### UI Overview
* `#start` - Start page with title, subtitle, and "create citation" button.
* `#info` - Tabbed page that contains information about APA, external resources, the software, and version history.
* `#select` - Page to select the type of the source.
* `#other` - Page with dropdown menu to specify the source type
* `#second` - Page to specify subtypes and formats.
* `#contributor` - Page to add any authors, editors or translators.
* `#title-date` - Page to enter information about the title and the date of publication.
* `#publication` - Page to enter information about the publisher, doi, url, volume, issue, etc.
* `#extra` - Page to enter any additional information as needed.
* `#annotation` - Page to enter any annotations to add after the citation.
* `#result` - Page to display the output.

#### UI Objects
Most pages in the DOM have their own object of properties that are called upon various points in the lifecycle of an object. The name of these objects are camelCase versions of their HTML ids.
```javascript
log();
  //Function: side effects
  //output - object
init();
  //Function: side effects
  //May take App.type, App.subtype, App.format as parameters
  //no output
resetWarnings();
  //Function: side effects
  //no output
default();
  //Function: side effects
  //no output
deinit();
  //Function: side effects
  //no output
verify();
  //Function: side effects
  //May take App.type, App.subtype, App.format as parameters
  //output - boolean
undo();
  //Function: side effects
  //no output
```

### App
`App` is an object that stores all of the data entered by the browser to the UI. App is created at runtime by a pseudoclassical constructor function named `Preset` in `app.js`.

#### App properties - default set by `Preset`
```javascript
type = '';
  //String: newspaper, magazine, journal, book, reference, webpage, or report
subtype = '';
  //String: depends on type
format = '';
  //String: print, ebook, online, digital, or web
author = [];
  //Array of strings: each string is full name, preprocessed before input
editor = [];
  //Array of arrays: each array is an array of strings to be processed later
translator = [];
  //Array of arrays: each array is an array of strings to be processed later
sectionTitle = '';
  //String
sourceTitle = '';
  //String
periodical = '';
  //String
date = 'n.d.';
  //String: has 'n.d.' by default, number or date converted into string
publisher = '';
  //String: preprocessed to Location: Publisher format before input
doi = '';
  //String
url = '';
  //String
vol = '';
  //String: number converted into string
issue = '';
  //String: number converted into string
ed = '';
  //String
pp = '';
  //String: number or range converted into string
reportNo = '';
  //String
retrieval = '';
  //String: date converted into string
ebook = '';
  //String
annotation = '';
  //String
```

#### App properties in relation to HTML elements
The properties of the App object are modified in the following locations in the DOM.
```
type -> #select or #other
subtype -> #second
format -> #second
author -> #contributor
editor -> #contributor
translator -> #contributor
sectionTitle -> #title-date
sourceTitle -> #title-date
periodical -> #title-date
date -> #title-date
publisher -> #publication
doi -> #publication
url -> #publication
vol -> #publication
issue -> #publication
ed -> #publication
pp -> #publication
reportNo -> #publication
retrieval -> #extra
ebook -> #extra
annotation -> #annotation
```

#### App.prototype
App delegates the following methods to `Preset.prototype` through the prototype chain.
```javascript
validateYear(y);
  //Function: no side effects
  //first argument - number converted to string (year)
  //output - boolean

validateDay(m, d);
  //Function: no side effects
  //first argument - string (month)
  //second argument - number or a number converted to string (day)
  //output - boolean

addAuthor(last, fi, mi, sfx);
  //Function: set author as side effect
  //first argument - string (last name)
  //second argument - string (first initial) [optional]
  //third argument - string (middle initial) [optional]
  //fourth argument - string (suffix) [optional]
  //no output

addEditor(last, fi, mi, sfx);
  //Function: set editor as side effect
  //first argument - string (last name)
  //second argument - string (first initial) [optional]
  //third argument - string (middle initial) [optional]
  //fourth argument - string (suffix) [optional]
  //no output

addTranslator(last, fi, mi, sfx);
  //Function: set translator as side effect
  //first argument - string (last name)
  //second argument - string (first initial) [optional]
  //third argument - string (middle initial) [optional]
  //fourth argument - string (suffix) [optional]
  //no output
```

### components
Components is an object created by a pseudoclassical constructor function `CreateComponents` in `app.js` from the `App` object, which is called in the transition between `#annotation` and `#result`. Hence, this object is only created in the last step, when all of the information is ready.
In the process of building the citation, the program may use the following properties from `components`.
```javascript
contributor = App.author, App.editor;
  //String: array of names joined to make a string
  //Contains authors and/or editors that will be placed in front of the date
editor = App.editor;
  //String: array of names joined to make a string
  //Contains editors that will not be placed in front of the date
translator = App.translator;
  //String: array of names joined to make a string
date = App.date;
  //String: surrounded by parentheses
section = App.sectionTitle;
  //String
source = App.sourceTitle;
  //String
periodical = App.periodical;
  //String: italicized
publication = App.vol, App.issue, App.ed, App.pp, App.reportNo;
  //String: formatted
  //Contains any necessary information to go beside the source title
publish = App.publisher, App.doi, App.url;
  //String: formatted
  //Contains any necessary information that go at the end of the citation
tag = App.ebook || App.subtype;
  //String: surrounded by brackets
annotations = App.annotation
  //String
```

### Miscellaneous
#### Tools
Tools is an object used in `app.js` to store common functions, such as parenthesize.

#### Errors
Errors is an object in `app.js` to conveniently store error messages.
