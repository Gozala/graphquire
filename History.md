# History #

## 0.8.0 / 2011-07-08 ##

  - Change API to use simplified URL pattern:
    foo.org/module -> http://foo.org/module.js
    !bar.org/index -> https://bar.org/index.js

## 0.7.0 / 2011-07-01 ##

  - Switching to actual URL's instead of 'http!' hacks.

## 0.6.1 / 2011-06-12 ##

  - Adding support for jetpack via `--cache-path ./` property.

## 0.6.0 / 2011-06-09 ##

 - Fix bug in read url (big files can be read now).
 - Adding `--no-source` option in order to exclude source.
 - Graph no longer contains paths / URLs for modules, instead it has resolvePath
   / resolveURI function that take module id and return path / uri.
 - Changed structure of graph, making it cleaner.

## 0.5.5 / 2011-06-01 ##

  - Make all local IDs are relative to `package.json`
  - Moved out package descriptor attributes into `metadata` attribute.

## 0.5.4 / 2011-05-30 ##

  - Bug fixes.

## 0.5.3 / 2011-05-30 ##

  - Bug fixes.

## 0.5.3 / 2011-05-30 ##

  - Improved output printed in verbose mode.
  - Code refactoring.

## 0.5.2 / 2011-05-29 ##

  - Improving print output

## 0.5.1 / 2011-05-29 ##

  - Adding property indicating preference of global installation.

## 0.5.0 / 2011-05-29 ##

  - Improved option parsing
  - Adding option to clean legacy dependencies.
  - Now graphquire can be used as install script of npm to install http!
    modules.

## 0.4.0 / 2011-05-28 ##

  - Ability to write dependency graph to the filesystem.

## 0.3.0 / 2011-05-26 ##

  - Ability to build graphs for remote packages

## 0.2.0 / 2011-05-26 ##

  - Complete redesign of the project goal and architecture.
  - `graphquire` command building json graph of main modules dependencies.

## 0.1.0 / 2010-04-02 ##

  - Initial release
