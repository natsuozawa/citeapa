/**
* @fileoverview runs CITE APA as a single page application
* @author Natsu Ozawa
* @license MIT
* any issues should be referred to the author via Github.
*/

const Format = {
  addPeriod: (str) => ((str.slice(-1) !== '.' && str.length > 0) ? str + '.' : str),
  checkCapitalization: (str) => (str ? str.slice(0, 1).toUpperCase() + str.slice(1) : str),
  italicize: (str) => str ? '<i>' + str + '</i>' : str,
  parenthesize: (str) => str ? '(' + str + ')' : str,
  bracketize: (str) => str ? '[' + str + ']' : str,
  ampersand: (arr) => {
    if (arr.length > 1) arr[arr.length - 1] = '& ' + arr[arr.length - 1];
    return arr;
  }
};

const Dev = {
  or: (sbj, arr) => arr.indexOf(sbj) !== -1
};

const Tools = Object.assign(Format, Dev, {
  //specific tools
  addContributor: (last, fi, mi, sfx) => {
    let arr = [];
    last = Format.checkCapitalization(last);
    if (fi) {
      arr.push(last + ',');
      arr.push(fi + '.');
    } else arr.push(last);
    if (fi && mi) arr.push(mi + '.');
    if (fi && sfx) {
      arr[arr.length - 1] += ',';
      arr.push(sfx);
    }
    return arr.join(' ');
  },
  addEditorOrTranslator: (last, fi, mi, sfx) => {
    let arr = [];
    if (fi) arr.push(fi + '.');
    if (mi) arr.push(mi + '.');
    arr.push(Format.checkCapitalization(last));
    if (sfx) arr.push(sfx);
    return arr.join(' ');
  },
  validateNumber: (num) => {
    //cancels non-numbers, negative numbers, decimals
    const re = /^\d+$/;
    return re.test(num);
  },
  validateRange: function(range) {
    //only accepts ##-##
    const re = /^\d+-\d+$/;
    const check = r => {
      const arr = r.split('-');
      return arr[1] - arr[0] > 0;
    }
    return this.validateNumber(range) ? true : re.test(range) ? check(range) : false;
  },
  modifyContributors: (auth) => {
    if (auth.length > 1) auth[auth.length - 1] = '& ' + auth[auth.length - 1];
    return auth;
  },
  modifyAuthors: (arr) => {
    let auth = arr.slice();
    if (auth.length >= 8) {
      auth.splice(6, auth.length - 7);
      auth[6] = '... ' + auth[6];
    } else Format.modifyContributors(auth);
    return auth;
  }
});

const Preset = function(save) {
  this.type = '';
  this.subtype = '';
  this.format = '';
  if (!save) { //normal call
    this.author = [];
    this.editor = [];
    this.translator = [];
  } else {
    this.other = 'newspaper';
    this.contributor = [];
    this.stateRadio = true;
    this.doiRadio = true;
  }
  this.sectionTitle = '';
  this.sourceTitle = '';
  this.periodical = '';
  this.date = 'n.d.';
  this.publisher = '';
  this.doi = '';
  this.url = '';
  this.vol = '';
  this.issue = '';
  this.ed = '';
  this.pp = '';
  this.reportNo = '';
  this.retrieval = '';
  this.ebook = '';
  this.website = '';
  this.annotation = '';
}

Preset.prototype.validateYear = (y) => {
  let date = new Date();
  return date.getFullYear() < parseInt(y) ? false : Tools.validateNumber(y);
};

Preset.prototype.validateDay = (m, d) => {
  if (d <= 0 || d > 31 || (m === 'February' && d > 29) || Tools.or(m, ['Spring', 'Summer', 'Fall', 'Winter'])) {
    return false;
  } else if (Tools.or(m, ['April', 'June', 'September', 'November']) && d > 30) {
    return false;
  } else {
    return Tools.validateNumber(d);
  }
};

Preset.prototype.addAuthor = function(last, fi, mi, sfx) {
  this.author.push(Tools.addContributor(last, fi, mi, sfx));
};

Preset.prototype.addEditor = function(last, fi, mi, sfx) {
  this.editor.push([last, fi, mi, sfx]);
};

Preset.prototype.addTranslator = function(last, fi, mi, sfx) {
  this.translator.push([last, fi, mi, sfx]);
};

const Errors = {
  general: 'Error 1000: There was an error with your request. Please retry.',
  notSupported: 'Error 1001: This format is not supported yet. Please select another.',
  secondAdvance: 'Error 1501: Advance releases are only published digitally. Please select "digital" as the format.',
  secondWiki: 'Error 1502: Only digital versions change over time.',
  contributorType: 'Error 1601: The selected contributor type is not available for the specified publication category.',
  contributorLast: 'Error 1611: The last name of the highlighted contributor is missing.',
  contributorFirst: 'Error 1612: The first name of the highlighted contributor is missing.',
  dateInvalidDay: 'Error 1701: The entered day is invalid.',
  dateInvalidYear: 'Error 1702: The entered year is invalid.',
  dateNoMonth: 'Error 1711: The entry is missing the month.',
  dateNoYear: 'Error 1712: The entry is missing the year.',
  dateNoTitle: 'Error 1721: The entry is missing a title.',
  publisherIncomplete: 'Error 1801: The publisher information is incomplete. Please make sure to fill out all fields.',
  publisherInvalidState: 'Error 1802: The state entered is invalid. Please make sure to use the correct abbreviation.',
  doiUrlMissing: 'Error 1811: The doi or url field is empty.',
  urlMissing: 'Error 1821: The url field is empty.',
  viepInvalidPages: 'Error 1831: The page(s) entered is/are invalid.',
  viepInvalidNumber: 'Error 1832: The information entered for the volume/issue field must be a number.',
  viepNoIssue: 'Error 1841: The issue field is empty.',
  viepNoVol: 'Error 1842: The volume field is empty.',
  viepNoEd: 'Error 1843: The edition field is empty.',
  viepNoPages: 'Error 1844: The pages field is empty.',
  ebookEditionMissing: 'Error 1901: The ebook edition field is empty.',
  copyUnsuccessful: 'Error 1002: Copy was unsuccessful. Please check your browser version and settings.'
};

let App = new Preset();

const CreateComponents = function(a) {
  this.editor = '';
  if (a.editor.length > 0 && a.subtype !== 'chapter') {
    a.editor = a.editor.map(c => Tools.addContributor(c[0], c[1], c[2], c[3]));
    if (a.editor.length === 1) a.editor[0] += ' (Ed.)';
    else if (a.editor.length > 1) a.editor[a.editor.length - 1] += ' (Eds.)';

    a.contributor = Tools.modifyAuthors(a.author.concat(a.editor));
    this.contributor = a.contributor.join(', ');
  } else {
    a.contributor = Tools.modifyAuthors(a.author);
    this.contributor = a.contributor.join(', ');

    if (a.editor.length > 0) {
      a.editor = a.editor.map(c => Tools.addEditorOrTranslator(c[0], c[1], c[2], c[3]));
      a.editor = Tools.ampersand(a.editor);
      if (a.editor.length === 1) a.editor[0] += ' (Ed.)';
      else if (a.editor.length > 1) a.editor[a.editor.length - 1] += ' (Eds.)';
      this.editor = a.editor.join(', ');
    }
  }

  this.translator = '';
  if (a.translator.length > 0) {
    a.translator = a.translator.map(c => Tools.addEditorOrTranslator(c[0], c[1], c[2], c[3]));
    a.translator = Tools.ampersand(a.translator);
    a.translator[a.translator.length - 1] += ', Trans.';
    this.translator = a.translator.length > 2 ? a.translator.join(', ') : a.translator.join(' ');
    this.translator = Tools.parenthesize(this.translator);
  }

  this.date = Tools.parenthesize(a.date);
  this.section = Tools.checkCapitalization(a.sectionTitle);
  this.source = Tools.checkCapitalization(a.sourceTitle);
  if (a.type === 'book' || a.type === 'reference' || a.type === 'report') this.source = Tools.italicize(this.source);
  this.periodical = Tools.italicize(Tools.checkCapitalization(a.periodical));

  this.publication = '';
  if (Tools.or(a.type, ['journal', 'magazine', 'newspaper'])) {
    let temp = '';
    if (a.vol) temp += ', ' + Tools.italicize(a.vol);
    if (a.issue) temp += Tools.parenthesize(a.issue);
    if (a.type === 'newspaper') {
      if (a.pp.indexOf('-') !== -1) temp += ', pp. ' + a.pp;
      else if (a.pp) temp += ', p. ' + a.pp;
    } else {
      if (a.pp) temp += ', ' + a.pp;
    }
    this.publication = temp;
  } else if (a.type === 'book' || a.type === 'reference') {
    let temp = [];
    if (a.ed) temp.push(a.ed + ' ed.');
    if (a.vol) temp.push('Vol. ' + a.vol);
    if (a.pp.indexOf('-') !== -1) temp.push('pp. ' + a.pp);
    else if (a.pp) temp.push('p. ' + a.pp);
    if (temp.length > 0) temp = Tools.parenthesize(temp.join(', '));
    this.publication = temp.length > 0 ? temp: '';
  } else if (a.type === 'report') {
    if (a.reportNo) this.publication = Tools.parenthesize(a.reportNo);
  }

  this.publish = '';
  if (a.format === 'print') {
    if (Tools.or(a.type, ['book', 'reference', 'report'])) this.publish = Tools.checkCapitalization(Tools.addPeriod(a.publisher));
  } else {
    if (a.doi) {
      this.publish = 'doi: ' + a.doi;
    } else if (a.url) {
      if (a.retrieval) this.publish = 'Retrieved ' + a.retrieval + ', from ' + a.url;
      else if (a.website) this.publish = 'Retrieved from ' + a.website + ' website: ' + a.url;
      else if (a.subtype === 'abstract') this.publish = 'Abstract retrieved from ' + a.url;
      else this.publish = 'Retrieved from ' + a.url;
    }
  }

  this.tag = '';
  if (a.format === 'ebook') this.tag = Tools.bracketize(a.ebook);
  else if (a.subtype === 'sp-issue') this.tag = '[Special issue]';
  else if (a.subtype === 'sp-section') this.tag = '[Special section]';
  else if (a.subtype === 'abstract' && a.url.length <= 0) this.tag = '[Abstract]';

  this.annotations = a.annotation;
}

function buildCitation(components, a) {
  let result = [];

  if (components.tag) components.source += ' ' + components.tag;
  let section = components.translator ? components.section + ' ' + components.translator : components.section;
  section = Tools.addPeriod(section);
  let title = Tools.or(a.type, ['book', 'reference', 'report']) && components.publication ? components.source + ' ' + components.publication : components.source;
  title = Tools.addPeriod(title);

  //first section
  if (components.contributor.length > 0) result.push(components.contributor);
  else if (components.section.length > 0) result.push(section);
  else result.push(title);
  result[0] = Tools.addPeriod(result[0]);

  //second section (in parentheses)
  result.push(Tools.addPeriod(components.date));

  //third section (title and periodical)
  if ((a.type === 'book' || a.type === 'reference') && a.subtype === 'chapter') {
    if (result[0] !== section) result.push(section);
    let temp = 'In ';
    if (components.editor) temp += components.editor + ', ';
    temp += components.source;
    if (components.publication) temp += ' ' + components.publication;
    result.push(Tools.addPeriod(temp));
  } else {
    if (result[0] !== title) {
      if (components.translator) {
        title = components.source + ' ' + components.translator;
        console.log(components.publication);
        if (components.publication) title += ' ' + components.publication;
        title = Tools.addPeriod(title);
      }
      result.push(title);
    } else if (components.translator) result.push(Tools.addPeriod(components.translator));
    if (Tools.or(a.type, ['journal', 'magazine', 'newspaper'])) result.push(Tools.addPeriod(components.periodical + components.publication));
  }

  //fourth section (publication information)
  if (a.subtype === 'advance') result.push('Advance online publication.');
  result.push(components.publish);

  //fifth section (annotations)
  if (components.annotations) result.push(components.annotations);

  //Result
  return result.join(' ');
}

function createCitation() {
  //for immutability of original data
  const a = JSON.parse(JSON.stringify(App));
  const components = new CreateComponents(a);
  return buildCitation(components, a);
}

let beforeInfo = '#start', beforeSecond = '#select', beforeAnnotation = '#publication';

//UI process
$(document).ready(function() {
  //Page objects
  const Page = {
    to: (destination) => {
      $('.page:visible').hide();
      $(destination).show();
      CITEAPA.setPage(destination);
    }
  };

  const second = {
    log: (at = App.type, as = App.subtype, af = App.format) => {
      if (Tools.or(at, ['newspaper', 'magazine', 'journal', 'reference', 'report'])) af = $('#print-digital :checked').val();
      if (at === 'journal') as = $('#journal :checked').val();
      if (at === 'book') {
        af = $('#print-ebook-online :checked').val();
        as = $('#chapter-entire :checked').val();
      }
      if (at === 'reference' || at === 'webpage') as = $('#wiki :checked').val();
      if (at === 'webpage') af = 'web';
      return {subtype: as, format: af};
    },
    init: function(at = App.type) {
      switch (at) {
        case 'newspaper':
          $('#second #print-digital').show();
          break;
        case 'magazine':
          $('#second #print-digital').show();
          break;
        case 'journal':
          $('#second #print-digital').show();
          $('#second #journal').show();
          $('#second .error-message').html('Advance releases are only published digitally.');
          break;
        case 'book':
          $('#second #print-ebook-online').show();
          $('#second #chapter-entire').show();
          break;
        case 'reference':
          $('#second #print-digital').show();
          $('#second #wiki').show();
          break;
        case 'webpage':
          $('#second #wiki').show();
          break;
        case 'report':
          $('#second #print-digital').show();
          break;
        default:
          console.error(Errors.notSupported);
          Page.to(beforeSecond);
          App.type = '';
          alert('Sorry, this format is not supported yet');
      }
    },
    resetWarnings: () => {
      $('#second .error-message').css('visibility', 'hidden');
    },
    default: () => {
      $('#second .entry').hide();
    },
    deinit: function() {
      this.default();
      this.resetWarnings();
    },
    verify: function(at = App.type) {
      this.resetWarnings();
      let pass = true;

      if (at === 'journal' && $('#print-digital :checked').val() === 'print' && $('#journal :checked').val() === 'advance') {
        pass = false;
        console.error(Errors.secondAdvance);
      }

      if (at === 'reference' && $('#print-digital :checked').val() === 'print' && $('#wiki :checked').val() === 'change-true') {
        pass = false;
        console.error(Errors.secondWiki);
      }

      return pass;
    },
    undo: () => {
      App.format = '';
      App.subtype = '';
    }
  };

  const contributor = {
    log: () => {
      let arr = [];
      $('#contributor .input-block').each(function() {
        let cont = {
          type: $(this).find('select :selected').val(),
          last: $(this).find('.last').val(),
          first: $(this).find('.first').val(),
          middle: $(this).find('.middle').val(),
          suffix: $(this).find('.suffix').val()
        }
        arr.push(cont);
      });
      return arr;
    },
    add: function() {
      let temp = this.log();
      temp.forEach(cont => {
        if (cont.last) {
          if (cont.type === 'author') App.addAuthor(cont.last, cont.first, cont.middle, cont.suffix);
          else if (cont.type === 'editor') App.addEditor(cont.last, cont.first, cont.middle, cont.suffix);
          else if (cont.type === 'translator') App.addTranslator(cont.last, cont.first, cont.middle, cont.suffix);
        }
      });
    },
    visibleContributorOptions: [],
    showOptionsBasedOnType: function(at = App.type, as = App.subtype) {
      if (at === 'book' || at === 'reference') {
        $('#contributor option').show();
        this.visibleContributorOptions = ['author', 'editor', 'translator'];
      } else if (at === 'journal' && (as === 'sp-issue' || as === 'sp-section')) {
        $('#contributor .author, #contributor .editor').show();
        this.visibleContributorOptions = ['author', 'editor'];
      } else if (Tools.or(at, ['newspaper', 'magazine', 'webpage', 'report', 'journal'])) {
        $('#contributor .author').show();
        this.visibleContributorOptions = ['author'];
      }
    },
    init: function() {
      this.showOptionsBasedOnType();
    },
    addFirstContributor: function(type = 'author', fi = '', mi = '', last = '', sfx = '') {
      $('#contributor .block').append(`
        <div class="input-block">
          <div>
            <select name="type">
              <option class= "author" value="author">Author</option>
              <option class= "editor" value="editor">Editor</option>
              <option class= "translator" value="translator">Translator</option>
            </select>
          </div>
          <div>
            <label>F.I.</label>
            <input class="first" size="1" maxlength="1" type="text" value="${fi}">
          </div>
          <div>
            <label>M.I.</label>
            <input class="middle" size="1" maxlength="1" type="text" value="${mi}">
          </div>
          <div>
            <label>Last Name</label>
            <input class="last" type="text" value="${last}">
          </div>
          <div>
            <label>Suffix</label>
            <input class="suffix" type="text" value="${sfx}">
          </div>
          <div class="minus"></div>
        </div>`
      );
      $('#contributor .input-block:first-child select').val(type);
      this.showOptionsBasedOnType();
    },
    addSubsequentContributor: function(type = 'author', fi = '', mi = '', last = '', sfx = '') {
      $('#contributor .block').append(`
        <div class="input-block">
          <select name="type">
            <option class= "author" value="author">Author</option>
            <option class= "editor" value="editor">Editor</option>
            <option class= "translator" value="translator">Translator</option>
          </select>
          <input class="first" size="1" maxlength="1" type="text" value="${fi}">
          <input class="middle" size="1" maxlength="1" type="text" value="${mi}">
          <input class="last" type="text" value="${last}">
          <input class="suffix" type="text" value="${sfx}">
          <div class="minus"></div>
        </div>`
      );
      $('#contributor .input-block:last-child select').val(type);
      this.showOptionsBasedOnType();
    },
    deleteContributor: function(inputBlock) {
      inputBlock.remove();
      if ($(inputBlock).is(':first-child')) {
        let inputValues = {
          type: $('#contributor .input-block:first-child').find('select :selected').val(),
          first: $('#contributor .input-block:first-child').find('.first').val() || '',
          middle: $('#contributor .input-block:first-child').find('.middle').val() || '',
          last: $('#contributor .input-block:first-child').find('.last').val() || '',
          suffix: $('#contributor .input-block:first-child').find('.suffix').val() || ''
        };

        $('#contributor .input-block:first-child').html(`
          <div>
            <select name="type">
              <option class= "author" value="author">Author</option>
              <option class= "editor" value="editor">Editor</option>
              <option class= "translator" value="translator">Translator</option>
            </select>
          </div>
          <div>
            <label>F.I.</label>
            <input class="first" size="1" maxlength="1" type="text" value="${inputValues.first}">
          </div>
          <div>
            <label>M.I.</label>
            <input class="middle" size="1" maxlength="1" type="text" value="${inputValues.middle}">
          </div>
          <div>
            <label>Last Name</label>
            <input class="last" type="text" value="${inputValues.last}">
          </div>
          <div>
            <label>Suffix</label>
            <input class="suffix" type="text" value="${inputValues.suffix}">
          </div>
          <div class="minus"></div>`);

          $('#contributor .input-block:first-child select').val(inputValues.type);
          this.showOptionsBasedOnType();
      }
    },
    resetWarnings: () => {
      $('#contributor .error-message').css('visibility', 'hidden');
      $('#contributor input').css('border-bottom', '2px solid transparent');
      $('#contributor select').css('color', '#202020');
    },
    default: () => {
      $('#contributor option').hide();
    },
    deinit: function() {
      this.resetWarnings();
      this.default();
    },
    verify: function() {
      this.resetWarnings();
      let pass = true;

      //evaluate validity of each entry
      $('#contributor .input-block').each(function() {
        let c = {
          type: $(this).find('select :selected').val(),
          last: $(this).find('.last').val(),
          first: $(this).find('.first').val(),
          middle: $(this).find('.middle').val(),
          suffix: $(this).find('.suffix').val()
        }

        if (contributor.visibleContributorOptions.indexOf(c.type) === -1) {
          $(this).find('select').css('color', '#f25c32');
          pass = false;
          console.error(Errors.contributorType);
        }

        if (c.last.length <= 0 && (c.first.length > 0 || c.middle.length > 0 || c.suffix.length > 0)) {
          $(this).find('.last').css('border-bottom', '2px solid #f25c32');
          if (c.first.length <= 0) {
            $(this).find('.first').css('border-bottom', '2px solid #f25c32');
            console.error(Errors.contributorFirst);
          }
          pass = false;
          console.error(Errors.contributorLast);
        } else if (c.first.length <= 0 && (c.middle.length > 0 || c.suffix.length > 0 || (c.type !== 'author' && c.last.length > 0))) {
          $(this).find('.first').css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.contributorFirst);
        }
      });
      return pass;
    },
    undo: () => {
      App.author = [];
      App.editor = [];
      App.translator = [];
    }
  };

  const titleDate = {
    log: (at = App.type, as = App.subtype, asc = App.sectionTitle, ast = App.sourceTitle, ap = App.periodical, ad = App.date) => {
      if (at === 'reference' || (at === 'book' && as === 'chapter')) asc = $('#section-title input').val();
      ast = $('#source-title input').val();
      if (Tools.or(at, ['journal', 'newspaper', 'magazine'])) ap = $('#periodical input').val();
      ad = $('#date input[name="year"]').val();
      if ((at === 'newspaper' || at === 'magazine') && $('#date select').val() !== 'n.d.') ad += ', ' + $('#date select').val();
      if ((at === 'newspaper' || at === 'magazine') && $('#date input[name="day"]').val() != false) ad += ' ' + $('#date input[name="day"]').val();
      if (!ad) ad = 'n.d.';
      return {sectionTitle: asc, sourceTitle: ast, periodical: ap, date: ad};
    },
    init: function(at = App.type, as = App.subtype) {
      if (at === 'reference' || (at === 'book' && as === 'chapter')) $('#title-date #section-title').show();
      if (Tools.or(at, ['journal', 'newspaper', 'magazine'])) $('#title-date #periodical').show();
      if (at === 'newspaper' || at === 'magazine') {
        $('#date select[name="month"]').show();
        $('#date input[name="day"]').show();
      }
    },
    resetWarnings: () => {
      $('#title-date .error-message').css('visibility', 'hidden');
      $('#title-date input').css('border-bottom', '2px solid transparent');
      $('#title-date select').css('color', '#202020');
    },
    default: () => {
      $('#section-title, #periodical').hide();
      $('#date select, #date input[name="day"]').hide();
    },
    deinit: function() {
      this.resetWarnings();
      this.default();
    },
    verify: function(at = App.type) {
      this.resetWarnings();
      let pass = true;

      let d = {
        month: $('#date select :selected').val(),
        day: $('#date input[name="day"]').val(),
        year: $('#date input[name="year"]').val()
      };

      if (at === 'newspaper' || at === 'magazine') { //year, month, day
        if (!App.validateDay(d.month, d.day) && d.day.length > 0) {
          $('#date input[name="day"]').css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.dateInvalidDay);
        }

        if (Tools.or(d.month, ['n.d.', 'Spring', 'Summer', 'Fall', 'Winter']) && d.day.length > 0) { // n.d. as in not defined, not apa
          $('#date select').css('color', '#f25c32');
          pass = false;
          console.error(Errors.dateNoMonth)
        }

        if (d.year.length <= 0 && d.month !== 'n.d.') {
          $('#date input[name="year"]').css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.dateNoYear);
        }
      }

      //year validation
      if (!App.validateYear(d.year) && d.year.length > 0) {
        $('#date input[name="year"]').css('border-bottom', '2px solid #f25c32');
        pass = false;
        console.error(Errors.dateInvalidYear);
      }

      //check for empty queries besides the date
      $('#title-date .entry:not(#date) input:visible').each(function() {
        if ($(this).val().length <= 0) {
          $(this).css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.dateNoTitle);
        }
      });

      return pass;
    },
    undo: () => {
      App.sectionTitle = '';
      App.sourceTitle = '';
      App.periodical = '';
      App.date = 'n.d.';
    }
  };

  const publication = {
    radioLog: () => {
      return {
        stateRadio: $('#publisher input[type="radio"][value="state"]').prop('checked'),
        doiRadio: $('#doi-url input[type="radio"][value="doi"]').prop('checked')
      };
    },
    log: (apb = App.publisher, ado = App.doi, au = App.url, av = App.vol, ai = App.issue, aed = App.ed, apg = App.pp, arn = App.reportNo) => {
      let at = App.type, as = App.subtype, af = App.format;
      if (af === 'print' && Tools.or(at, ['book', 'reference', 'report'])) {
        let publ = $('#publisher input[name="city"]').val();
        if ($('#publisher input[name="location"]:checked').val() === 'state') publ += ', ' + $('#publisher input[name="state"]').val();
        else publ += ', ' + $('#publisher input[name="country"]').val();
        apb = publ + ': ' + Tools.checkCapitalization($('#publisher input[name="publisher-name"]').val());
      } else if (af === 'digital' || af === 'ebook') {
        if ($('#doi-url input[name="doi-url"]:checked').val() === 'doi') ado = $('#doi-url input[name="doi"]').val();
        else au = $('#doi-url input[name="url"]').val();
      } else if (af === 'web') {
        au = $('#url input[name="url"]').val();
      }
      if (Tools.or(at, ['book', 'reference', 'magazine']) || Tools.or(as, ['sp-issue', 'sp-section', 'article', 'abstract'])) {
        av = $('#viep input[name="vol"]').val() || av;
      }
      if (at === 'book' || at === 'reference') {
        aed = $('#viep input[name="ed"]').val() || aed;
      } else if (at === 'magazine' || as === 'sp-issue') {
        ai = $('#viep .input-block > div:nth-child(3) input').val() || ai;
      } else if (Tools.or(as, ['article', 'abstract', 'sp-section'])) {
        ai = $('#viep .input-block > div:nth-child(2) input').val() || ai;
      }
      if (Tools.or(as, ['article', 'sp-section', 'abstract']) || at === 'newspaper' || at === 'magazine' || as === 'chapter') {
        apg = $('#viep input[name="pp"]').val() || apg;
      }
      if (at === 'report') arn = $('#report-no input[name="report-no"]').val() || arn;
      return {publisher: apb, doi: ado, url: au, vol: av, issue: ai, ed: aed, pp: apg, reportNo: arn};
    },
    viepInit: (at = App.type, as = App.subtype, af = App.format) => {
      $('#viep input').css('border-bottom', '2px solid transparent');
      if (at === 'book' || at === 'reference') {
        $('#viep input[name="vol"], #viep input[name="ed"]').css('border-bottom', '2px solid #3e72c4');
      } else if (as === 'article' || as === 'abstract' || as === 'sp-section') {
        $('#viep .input-block > div:nth-child(2) input').css('border-bottom', '2px solid #3e72c4');
      }
      if (at === 'newspaper' || at === 'magazine' || as === 'chapter' || (at === 'journal' && af === 'digital')) {
        $('#viep input[name="pp"]').css('border-bottom', 'solid 2px #3e72c4');
      }
    },
    init: function(at = App.type, as = App.subtype, af = App.format) {
      //publisher query
      if (Tools.or(at, ['book', 'reference', 'report']) && af === 'print') {
        $('#publisher').show();
        $('#publication .hint').show();
        $('#publication .hint-box').html('<p>For the publisher name, omit common terms such as <i>Publishers</i>, <i>Co.</i>, and <i>Inc.</i> Do not omit <i>Books</i> or <i>Press</i>. If author is the publisher, write <i>Author</i> as the publisher name.</p>');
      } else if (af === 'ebook' || af === 'digital') {
        $('#doi-url').show();
      } else if (af === 'web') {
        $('#url').show();
      }

      //viep query
      if (as !== 'advance' && at !== 'webpage' && at !== 'report') {
        $('#viep').show();
        $('#viep .input-block > div').hide();

        if (at === 'book' || at === 'reference') {
          $('#viep .input-block > div:first-child, #viep .input-block > div:nth-child(4)').show();
        } else if (at === 'magazine' || as === 'sp-issue') {
          $('#viep .input-block > div:first-child, #viep .input-block > div:nth-child(3)').show();
        } else if (Tools.or(as, ['article', 'abstract', 'sp-section'])) {
          $('#viep .input-block > div:first-child, #viep .input-block > div:nth-child(2)').show();
          $('#publication .hint').show();
          $('#publication .hint-box').html('<p>If each issue of the journal starts on page 1, include the issue. Otherwise, leave the issue blank.</p>');
        }

        if (Tools.or(as, ['article', 'sp-section', 'abstract']) || at === 'newspaper' || at === 'magazine' || as === 'chapter') {
          $('#viep .input-block > div:last-child').show();
        }
      }

      //report query
      if (at === 'report') $('#report-no').show();

      this.viepInit();
    },
    resetWarnings: () => {
      $('#publication .error-message').css('visibility', 'hidden');
      $('#publication input[type="text"]').css('border-bottom', '2px solid transparent');
    },
    default: () => {
      $('#publication .entry').hide();
      $('#publication .hint-box').html('');
      $('#publication .hint').hide();
    },
    deinit: function() {
      this.resetWarnings();
      this.default();
    },
    verify: function(at = App.type, as = App.subtype, af = App.format) {
      this.resetWarnings();
      let pass = true;

      if ($('#viep').is(':visible')) this.viepInit(at, as);

      //publisher
      if ($('#publisher').is(':visible')) {
        //check for empty queries
        $('#publisher input[type="text"]:visible').each(function() {
          if ($(this).val().length <= 0) {
            $(this).css('border-bottom', '2px solid #f25c32');
            pass = false;
            console.error(Errors.publisherIncomplete);
          }
        });

        //validate States
        if ($('#publisher input[name="location"]:checked').val() === 'state') {
          const st = ['AK', 'AL', 'AR', 'AS', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
          'GU','HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN',
          'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR',
          'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VI', 'VT', 'WA', 'WI', 'WV',
           'WY', 'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
          let v = $('#publisher input[name="state"]').val();

          if (st.indexOf(v) === -1 && v) {
            $('#publisher input[name="state"]').css('border-bottom', '2px solid #f25c32');
            pass = false;
            console.error(Errors.publisherInvalidState);
          }
        }
      }

      //doi-url
      if ($('#doi-url').is(':visible')) {
        if ($('#doi-url input[type="text"]:visible').val().length <= 0) {
          $('#doi-url input[type="text"]:visible').css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.doiUrlMissing);
        }
      }

      //url
      if ($('#url').is(':visible') && $('#url input').val().length <= 0) {
        $('#url input').css('border-bottom', '2px solid #f25c32');
        pass = false;
        console.error(Errors.urlMissing);
      }

      //viep
      if ($('#viep').is(':visible')) {
        $('#viep input:visible').each(function() {
          if ($(this).attr('name') === 'pp') {
            if (!Tools.validateRange($(this).val()) && $(this).val().length > 0 && at !== 'newspaper') {
              $(this).css('border-bottom', '2px solid #f25c32');
              pass = false;
              console.error(Errors.viepInvalidPages)
            }
          } else if ($(this).attr('name') !== 'ed' && !Tools.validateNumber($(this).val()) && $(this).val().length > 0) {
            $(this).css('border-bottom', '2px solid #f25c32');
            pass = false;
            console.error(Errors.viepInvalidNumber);
          }
        });

        if (at !== 'book' && at !== 'reference') {
          if (as !== 'article' && as !== 'abstract' && as !== 'sp-section' && $('#viep input[name="issue"]').is(':visible')) {
            if ($('#viep input[name="issue"]:visible').val().length <= 0) {
              $('#viep input[name="issue"]').css('border-bottom', '2px solid #f25c32');
              pass = false;
              console.error(Errors.viepNoIssue);
            }
          }
          if ($('#viep input[name="vol"]').is(':visible') && $('#viep input[name="vol"]').val().length <= 0) {
            $('#viep input[name="vol"]').css('border-bottom', '2px solid #f25c32');
            pass = false;
            console.error(Errors.viepNoVol);
          }
        }

        if (at === 'journal' && af !== 'digital' && $('#viep input[name="pp"]').is(':visible') && $('#viep input[name="pp"]').val().length <= 0) {
          $('#viep input[name="pp"]').css('border-bottom', '2px solid #f25c32');
          pass = false;
          console.error(Errors.viepNoPages);
        }
      }

      return pass;
    },
    undo: () => {
      App.publisher = '';
      App.doi = '';
      App.url = '';
      App.vol = '';
      App.issue = '';
      App.ed = '';
      App.pp = '';
      App.reportNo = '';
    }
  };

  const extra = {
    log: (at = App.type, as = App.subtype, af = App.format, art = App.retrieval, aeb = App.ebook, awb = App.website) => {
      if (as === 'change-true') {
        art = $('#retrieval-date select').val() + ' ' + $('#retrieval-date input[name="day"]').val() + ', ' + $('#retrieval-date input[name="year"]').val();
      }
      if (af === 'ebook') {
        aeb = $('#ebook-version input[name="version"]').val();
      }
      if (at === 'report' && af === 'digital') {
        awb = $('#website-name input').val();
      }
      return {retrieval: art, ebook: aeb, website: awb};
    },
    init: (at = App.type, as = App.subtype, af = App.format) => {
      if (as === 'change-true') {
        $('#retrieval-date').show();
        $('#extra .hint').show();
      } else if (af === 'ebook') {
        $('#ebook-version').show();
      } else if (at === 'report' && af === 'digital') {
        $('#website-name').show();
      }
    },
    setToday: () => {
      let today = new Date();

      function convertMonth(m) {
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[m];
      }

      $('#retrieval-date select').val(convertMonth(today.getMonth()));
      $('#retrieval-date input[name="day"]').val(today.getDate());
      $('#retrieval-date input[name="year"]').val(today.getFullYear());
    },
    resetWarnings: () => {
      $('#extra input[type="text"]').css('border-bottom', '2px solid transparent');
      $('#extra .error-message').css('visibility', 'hidden');
    },
    default: () => {
      $('#extra .hint').hide();
    },
    deinit: function() {
      this.resetWarnings();
      this.default();
    },
    verify: function() {
      this.resetWarnings();
      let pass = true;

      if ($('#retrieval-date').is(':visible')) {
        let d = {
          month: $('#retrieval-date select :selected').val(),
          day: $('#retrieval-date input[name="day"]').val(),
          year: $('#retrieval-date input[name="year"]').val()
        };

        if (!App.validateDay(d.month, d.day)) {
          pass = false;
          $('#retrieval-date input[name="day"]').css('border-bottom', '2px solid #f25c32');
          console.error(Errors.dateInvalidDay);
        }
        if (!App.validateYear(d.year)) {
          pass = false;
          $('#retrieval-date input[name="year"]').css('border-bottom', '2px solid #f25c32');
          console.error(Errors.dateInvalidYear);
        }
      }

      if ($('#ebook-version').is(':visible') && $('#ebook-version input').val().length <= 0) {
        pass = false;
        $('#ebook-version input').css('border-bottom', '2px solid #f25c32');
        console.error(Errors.ebookEditionMissing);
      }

      return pass;
    },
    undo: () => {
      App.retrieval = '';
      App.ebook = '';
    }
  };

  //jQuery functions
  function resetContent() {
    $('input[type="text"], textarea').val('');
    $('#other select').val('newspaper');
    $('#contributor select').val('author');
    $('#title-date select').val('n.d.');
    $('#contributor .input-block').remove();
    contributor.addFirstContributor();
    extra.setToday();
    App = new Preset();
  }

  // ### info page
  $('.info').click(function() {
    Page.to('#info');
    beforeInfo = '#' + $(this).parent().attr('id');
    CITEAPA.updateBefore();
  });

  $('#info .close').click(function() {
    Page.to(beforeInfo);
  });

  const list = ['APA', 'About', 'Version', 'Settings'];

  $('#content > div:first-child').show();
  $('#tab li:first-child').css('font-weight', '400');
  let current = 1;

  $('#tab li').click(function() {
    let name = $(this).html();
    let i = list.indexOf(name) + 1;
    $('#content > div:nth-child(' + current + ')').hide();
    $('#content > div:nth-child(' + i + ')').show();
    $('#tab li:nth-child(' + current + ')').css('font-weight', '100');
    $('#tab li:nth-child(' + i + ')').css('font-weight', '400');
    current = i;
    if (CITEAPA_SAVE) localStorage.setItem('CITEAPA_TAB', current);
  });

  // ### hint box
  $('.hint').hover(function() {
    $(this).parent().find('.hint-box').toggle();
  });

  // ### restart
  $('.restart').click(function() {
    if (confirm('Restart? This will reset your information.')) {
      resetContent();
      CITEAPA.resetStorage();

      second.default();
      contributor.default();
      titleDate.default();
      publication.default();
      extra.default();

      Page.to('#start');
    }
  });

  // ### start -> select
  $('#start .step').click(function() {
    Page.to('#select');
  });

  // ### select -> start
  $('#select .back').click(function() {
    Page.to('#start');
  });

  // ### select -> second
  $('#select .box:not(:last-child)').click(function() {
    App.type = $(this).find('h2').html().toLowerCase();
    Page.to('#second');
    beforeSecond = '#select';
    CITEAPA.updateBefore();
    CITEAPA.logStorage({type: App.type});
    second.init();
    CITEAPA.logStorage(second.log());
  });

  // ### select -> other
  $('#select .box:last-child').click(function() {
    Page.to('#other');
  });

  // ### other -> select
  $('#other .back').click(function() {
    Page.to('#select');
  });

  // ### other
  $('#other select').on('change', function() {
    CITEAPA.logStorage({other: $(this).val()});
  });

  // ### other -> second
  $('#other .step, #other .forward').click(function() {
    App.type = $('#other select :selected').val();
    Page.to('#second');
    beforeSecond = '#other';
    CITEAPA.updateBefore();
    CITEAPA.logStorage({type: App.type});
    second.init();
    CITEAPA.logStorage(second.log());
  });

  // ### second -> other or select
  $('#second .back').click(function() {
    second.deinit();
    App.type = '';
    Page.to(beforeSecond);
  });

  // ### second processes
  $('#second input[type="radio"]').each(function() {
    $(this).prop('checked', function() {
      return Tools.or($(this).val(), ['print', 'change-false', 'entire', 'article']);
    });
  });
  $('#second input[type="radio"]').on('change', function() {
    CITEAPA.logStorage(second.log());
  });

  // ### second -> contributor
  $('#second .step, #second .forward').click(function() {
    if (second.verify()) {
      App = Object.assign(App, second.log());

      Page.to('#contributor');
      contributor.init();
      CITEAPA.logStorage({contributor: contributor.log()});
    } else {
      $('#second .error-message').css('visibility', 'visible');
    }
  });

  // ### contributor -> second
  $('#contributor .back').click(function() {
    contributor.deinit();
    second.undo();
    Page.to('#second');
  });

  //#contributor processes
  $('#contributor').on('click', '.plus', function() {
    if ($('#contributor .block').children().length == 0) contributor.addFirstContributor();
    else contributor.addSubsequentContributor();
    CITEAPA.logStorage({contributor: contributor.log()});
  });

  $('#contributor').on('click', '.minus', function() {
    //to preserve the labels
    let inputBlock = $(this).parent(); //to avoid this complications in function created scope
    contributor.deleteContributor(inputBlock);
    CITEAPA.logStorage({contributor: contributor.log()});
  });

  $('#contributor').on('input', '.first, .middle', function() {
    //automatically make the initials uppercase
    let initial = $(this).val().toUpperCase();
    $(this).val(initial);
  });

  $('#contributor').on('change', 'select', function() {
    CITEAPA.logStorage({contributor: contributor.log()});
  });

  $('#contributor').on('input', 'input', function() {
    CITEAPA.logStorage({contributor: contributor.log()});
  });

  // ### contributor -> title-date
  $('#contributor button, #contributor .forward').click(function() {
    if (contributor.verify()) {
      contributor.add();

      Page.to('#title-date');
      titleDate.init();
      CITEAPA.logStorage(titleDate.log());
    } else {
      $('#contributor .error-message').css('visibility', 'visible');
    }
  });

  // ### title-date -> contributor
  $('#title-date .back').click(function() {
    titleDate.deinit();
    contributor.undo();
    Page.to('#contributor');
  });

  // ### title-date processes
  $('#title-date a').hover(function() {
    $('#title-date .hint-box').toggle();
  });

  $('#title-date select').on('change', function() {
    CITEAPA.logStorage(titleDate.log());
  });

  $('#title-date input').on('input', function() {
    CITEAPA.logStorage(titleDate.log());
  });

  // ### title-date -> publication
  $('#title-date .step, #title-date .forward').click(function() {
    if (titleDate.verify()) {
      App = Object.assign(App, titleDate.log());

      Page.to('#publication');
      publication.init();
      CITEAPA.logStorage(publication.log());
      CITEAPA.logStorage(publication.radioLog());
    } else {
      $('#title-date .error-message').css('visibility', 'visible');
    }
  });

  // ### publication -> title-date
  $('#publication .back').click(function() {
    publication.deinit();
    titleDate.undo();
    Page.to('#title-date');
  });

  // ### publication processes
  $('#publisher input[type="radio"][value="state"]').prop('checked', true);
  $('#publisher input[type="radio"][value="international"]').prop('checked', false);
  $('#publisher input[type="radio"]').on('change', function() {
    $('#publisher input[name="state"]').toggle();
    $('#publisher input[name="country"]').toggle();
  });

  $('#publisher input[name="state"]').on('input', function() {
    let stateName = $(this).val().toUpperCase();
    $(this).val(stateName);
  });

  $('#doi-url input[type="radio"][value="doi"]').prop('checked', true);
  $('#doi-url input[type="radio"][value="url"]').prop('checked', false);
  $('#doi-url input[type="radio"]').on('change', function() {
    $('#doi-url input[type="text"]').toggle();
  });

  $('#viep a').hover(function() {
    $('.hint-box').toggle();
  });

  $('#publication input[type="radio"]').on('change', function() {
    CITEAPA.logStorage(publication.radioLog());
  });

  $('#publication input[type="text"]').on('input', function() {
    CITEAPA.logStorage(publication.log());
  });

  // ### publication -> extra or annotation
  $('#publication .step, #publication .forward').click(function() {
    if (publication.verify(App.type, App.subtype, App.format)) {
      App = Object.assign(App, publication.log());
      if (App.subtype === 'change-true' || App.format === 'ebook' || (App.type === 'report' && App.format === 'digital' && $('#doi-url input[name="doi-url"]:checked').val() === 'url')) {
        Page.to('#extra');
        extra.init();
        extra.log();
      } else {
        Page.to('#annotation');
        beforeAnnotation = '#publication';
        CITEAPA.updateBefore();
      }
    } else {
      $('#publication .error-message').css('visibility', 'visible');
    }
  });

  // ### extra -> publication
  $('#extra .back').click(function() {
    extra.deinit();
    publication.undo();
    Page.to('#publication');
  });

  // ### extra processes
  extra.setToday();

  $('#extra select').on('change', function() {
    CITEAPA.logStorage(extra.log());
  });

  $('#extra input').on('input', function() {
    CITEAPA.logStorage(extra.log());
  });

  // ### extra -> annotation
  $('#extra .step, #extra .forward').click(function() {
    if (extra.verify()) {
      App = Object.assign(App, extra.log());
      beforeAnnotation = '#extra';
      CITEAPA.updateBefore();
      Page.to('#annotation');
      CITEAPA.logStorage({annotation: $('#annotation textarea').val()});
    } else {
      $('#extra .error-message').css('visibility', 'visible');
    }
  });

  // ### annotation -> extra or publication
  $('#annotation .back').click(function() {
    Page.to(beforeAnnotation);
    if (beforeAnnotation === '#publication') publication.undo();
    else extra.undo();
  });

  // ### annotation processes
  $('#annotation textarea').on('input', function() {
    CITEAPA.logStorage({annotation: $('#annotation textarea').val()});
  });

  // ### annotation -> result
  $('#annotation .step, #annotation .forward').click(function() {
    App.annotation = $('#annotation textarea').val() || App.annotation;
    Page.to('#result');
    $('#citation').html(createCitation());
  });

  // ### result -> annotation
  $('#result .back').click(function() {
    if (localStorage.getItem('CITEAPA_SAVED')) {
      if (confirm('Edit your original data? Your manual edits will not be reflected once you go back.')) {
        localStorage.removeItem('CITEAPA_SAVED');
      } else return;
    }
    App.annotation = '';
    Page.to('#annotation');
  });

  // ### result
  $('#result .step:first-child').click(function() {
    let text = document.getElementById('citation'), range, sel;

    if (document.createTextRange) { //ms
        range = document.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) { //rest
        sel = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    try {
      let copy = document.execCommand('copy');
      if (!copy) console.log(Errors.copyUnsuccessful);
    } catch (err) {
      console.error(Errors.copyUnsuccessful);
    }

    window.getSelection ? sel.removeAllRanges() : range.deselect();
  });

  // ### result -> edit
  $('#result .step:last-child').click(function() {
    Page.to('#edit');
    let citation = $('#citation').html();
    $('#edit textarea').val(citation);
    if (CITEAPA_SAVE) localStorage.setItem('CITEAPA_EDIT', citation);
  });

  // ### edit -> result
  $('#edit .back').click(function() {
    Page.to('#result');
    localStorage.removeItem('CITEAPA_EDIT');
  });

  $('#edit .step').click(function() {
    Page.to('#result');
    let citation = $('#edit textarea').val();
    $('#citation').html(citation);
    localStorage.setItem('CITEAPA_SAVED', citation);
    if (CITEAPA_SAVE) localStorage.removeItem('CITEAPA_EDIT');
  });

  // ### edit
  $('#edit textarea').on('input', function() {
    if (CITEAPA_SAVE) localStorage.setItem('CITEAPA_EDIT', $(this).val());
  });

  //CITEAPA startup
  const CITEAPA = {
    pages: ['#start', '#select', '#other', '#second', '#contributor', '#title-date', '#publication', '#extra', '#annotation', '#result', '#edit'],
    logStorage: (obj) => {
      if (!CITEAPA_SAVE) return;
      let CITEAPA_APP = JSON.parse(localStorage.getItem('CITEAPA_APP'));
      CITEAPA_APP = Object.assign(CITEAPA_APP, obj);
      localStorage.setItem('CITEAPA_APP', JSON.stringify(CITEAPA_APP));
    },
    setPage: (page) => {
      if (!CITEAPA_SAVE) return;
      localStorage.setItem('CITEAPA_PAGE', page);
    },
    resetStorage: () => {
      let jsonobj = JSON.stringify(new Preset(true));
      jsonobj = jsonobj.replace(/'/g, '"');
      localStorage.setItem('CITEAPA_APP', jsonobj);
      localStorage.removeItem('CITEAPA_PAGE');
      localStorage.removeItem('CITEAPA_BEFORE');
      localStorage.removeItem('CITEAPA_TAB');
    },
    updateBefore: () => {
      if (!CITEAPA_SAVE) return;
      localStorage.setItem('CITEAPA_BEFORE', JSON.stringify({
        info: beforeInfo,
        second: beforeSecond,
        annotation: beforeAnnotation
      }));
    }
  };

  let CITEAPA_SAVE;

  //invoked on startup
  (function CITEAPA_INVOKE() {
    resetContent();

    if (localStorage.getItem('CITEAPA_SAVE') === 'false') {
      CITEAPA_SAVE = false;
      if (localStorage.getItem('CITEAPA_SAVED')) localStorage.removeItem('CITEAPA_SAVED');
      return;
    } else {
      localStorage.setItem('CITEAPA_SAVE', 'true');
      CITEAPA_SAVE = true;

      if (!localStorage.getItem('CITEAPA_APP')) {
        CITEAPA.resetStorage();
      } else {

        (function CITEAPA_LOAD() {
          let CITEAPA_APP = JSON.parse(localStorage.getItem('CITEAPA_APP'));
          if (CITEAPA_APP.type) App.type = CITEAPA_APP.type;
          else return;
          $('#other select').val(CITEAPA_APP.other);
          if (CITEAPA_APP.subtype || CITEAPA_APP.format) {
            $('#second .entry').each(function() {
              let i = -1;
              $(this).find('input[type="radio"]').each(function(index) {
                if ($(this).val() === CITEAPA_APP.subtype || $(this).val() === CITEAPA_APP.format) i = index;
              });
              if (i > -1) {
                $(this).find('input[type="radio"]').each(function(index) {
                  $(this).prop('checked', i === index);
                });
              }
            });
          } else return;
          if (CITEAPA_APP.contributor.length > 0) {
            contributor.deleteContributor($('#contributor .input-block'));
            let arr = CITEAPA_APP.contributor;
            contributor.addFirstContributor(arr[0].type, arr[0].first, arr[0].middle, arr[0].last, arr[0].suffix);
            if (arr.length > 1) {
              for (let i = 1; i < arr.length; i++) {
                contributor.addSubsequentContributor(arr[i].type, arr[i].first, arr[i].middle, arr[i].last, arr[i].suffix);
              }
            }
          }
          if (CITEAPA_APP.sectionTitle) $('#section-title input').val(CITEAPA_APP.sectionTitle);
          if (CITEAPA_APP.sourceTitle) $('#source-title input').val(CITEAPA_APP.sourceTitle);
          if (CITEAPA_APP.periodical) $('#periodical input').val(CITEAPA_APP.periodical);
          if (CITEAPA_APP.date) {
            let arr = CITEAPA_APP.date.split(' ');
            if (arr.indexOf('n.d.') === -1) {
              arr[0] = arr[0].slice(-1) === ',' ? arr[0].slice(0, -1) : arr[0];
              $('#date input[name="year"]').val(arr[0]);
            }
            if (arr[1] && arr[1].length > 2) $('#date select').val(arr[1]);
            else if (arr[1]) $('#date input[name="day"]').val(arr[1]);
            if (arr[2]) $('#date input[name="day"]').val(arr[2]);
          }
          if (CITEAPA_APP.publisher) {
            let arr = CITEAPA_APP.publisher.split(': ');
            $('#publisher input[name="publisher-name"]').val(arr[1]);
            let newArr = arr[0].split(', ');
            $('#publisher input[name="city"]').val(newArr[0]);
            if (CITEAPA_APP.stateRadio && newArr[1].length <= 2) {
              $('#publisher input[name="state"]').val(newArr[1]);
            } else {
              $('#publisher input[name="country"]').val(newArr[1]);
              $('#publisher input[type="radio"]').prop('checked', function() {
                return !$(this).prop('checked');
              });
              $('#publisher input[name="state"]').toggle();
              $('#publisher input[name="country"]').toggle();
            }
          }
          if (CITEAPA_APP.format === 'digital' || CITEAPA_APP.format === 'ebook') {
            if (CITEAPA_APP.doi) $('#doi-url input[name="doi"]').val(CITEAPA_APP.doi);
            if (CITEAPA_APP.url) $('#doi-url input[name="url"]').val(CITEAPA_APP.url);
            if (!CITEAPA_APP.doiRadio) {
              $('#doi-url input[type="radio"]').prop('checked', function() {
                return !$(this).prop('checked');
              });
              $('#doi-url input[type="text"]').toggle();
            }
          } else if (CITEAPA_APP.url) {
            $('#url input').val(CITEAPA_APP.url);
          }
          if (CITEAPA_APP.vol) $('#viep input[name="vol"]').val(CITEAPA_APP.vol);
          if (CITEAPA_APP.issue) $('#viep input[name="issue"]').val(CITEAPA_APP.issue);
          if (CITEAPA_APP.ed) $('#viep input[name="ed"]').val(CITEAPA_APP.ed);
          if (CITEAPA_APP.pp) $('#viep input[name="pp"]').val(CITEAPA_APP.pp);
          if (CITEAPA_APP.reportNo) $('#report-no input[name="report-no"]').val(CITEAPA_APP.reportNo);
          if (CITEAPA_APP.retrieval) {
            let arr = CITEAPA_APP.retrieval.split(' ');
            $('#retrieval-date select').val(arr[0]);
            if (arr[1] && arr[1].length <= 2) $('#retrieval-date input[name="day"]').val(arr[1].slice(0, -1));
            else if (arr.length === 2) $('#retrieval-date input[name="year"]').val(arr[1]);
            if (arr[2]) $('#retrieval-date input[name="year"]').val(arr[2]);
          }
          if (CITEAPA_APP.ebook) $('#ebook-version input').val(CITEAPA_APP.ebook);
          if (CITEAPA_APP.website) $('#website-name input').val(CITEAPA_APP.website);
          if (CITEAPA_APP.annotation) $('#annotation textarea').val(CITEAPA_APP.annotation);
        })();

        if (!localStorage.getItem('CITEAPA_BEFORE')) {
          CITEAPA.updateBefore();
        } else {
          let temp = JSON.parse(localStorage.getItem('CITEAPA_BEFORE'));
          beforeInfo = temp.info;
          beforeSecond = temp.second;
          beforeAnnotation = temp.annotation;

          let pageTo = localStorage.getItem('CITEAPA_PAGE');
          let idx = CITEAPA.pages.indexOf(pageTo);

          if (pageTo === '#info') {
            if (CITEAPA.pages.indexOf(beforeInfo) > 2 && CITEAPA.pages.indexOf(beforeInfo) <= 10) {
              initiate(CITEAPA.pages.indexOf(beforeInfo));
            }
            Page.to('#info');
          } else if (idx < 0 || idx > 10) { //invalid
            return;
          } else if (idx === 0) {
            //start page, do nothing
          } else if (idx <= 2) {
            Page.to(pageTo);
          } else {
            initiate(idx);
            Page.to(pageTo);
          }

          function initiate(index) {
            if (index > 2) {
              second.init();

              if (index > 3) {
                App = Object.assign(App, second.log());
                contributor.init();

                if (index > 4) {
                  contributor.add();
                  titleDate.init();

                  if (index > 5) {
                    App = Object.assign(App, titleDate.log());
                    publication.init();

                    if (index > 6) {
                      App = Object.assign(App, publication.log());
                      if (beforeAnnotation === '#extra') extra.init();

                      if (index > 7) {
                        if (beforeAnnotation === '#extra') App = Object.assign(App, extra.log());

                        if (index > 8) {
                          App.annotation = $('#annotation textarea').val() || App.annotation;
                          let CITEAPA_SAVED = localStorage.getItem('CITEAPA_SAVED');
                          if (CITEAPA_SAVED) $('#citation').html(CITEAPA_SAVED)
                          else $('#citation').html(createCitation());

                          if (index > 9) {
                            let CITEAPA_EDIT = localStorage.getItem('CITEAPA_EDIT');
                            if (CITEAPA_EDIT) $('#edit textarea').val(CITEAPA_EDIT);
                            else $('#edit textarea').val($('#citation').html());
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } //end of initiate

        }
      }
    }
  })();

  let CITEAPA_TAB = localStorage.getItem('CITEAPA_TAB');
  if (CITEAPA_SAVE && CITEAPA_TAB) {
    $('#content > div:nth-child(' + current + ')').hide();
    $('#content > div:nth-child(' + CITEAPA_TAB + ')').show();
    $('#tab li:nth-child(' + current + ')').css('font-weight', '100');
    $('#tab li:nth-child(' + CITEAPA_TAB + ')').css('font-weight', '400');
    current = CITEAPA_TAB;
  }

  $('#content > div:last-child input[name="autosave"]').prop('checked', function() {
    return CITEAPA_SAVE;
  });

  $('#content > div:last-child input[name="autosave"]').on('change', function () {
    CITEAPA_SAVE = $(this).prop('checked');
    localStorage.setItem('CITEAPA_SAVE', CITEAPA_SAVE);
    if (CITEAPA_SAVE) {
      console.log('Autosave initiated. Logging necessary info...');
      CITEAPA.logStorage({type: App.type});
      CITEAPA.logStorage(second.log());
      CITEAPA.logStorage({contributor: contributor.log()});
      CITEAPA.logStorage(titleDate.log());
      CITEAPA.logStorage(publication.log());
      CITEAPA.logStorage(extra.log());
      CITEAPA.logStorage({annotation: $('#annotation textarea').val()});
      localStorage.setItem('CITEAPA_PAGE', '#info');
      CITEAPA.updateBefore();
    }
  });

  $('#content > div:last-child button').click(function() {
    CITEAPA.resetStorage();
  });
});
