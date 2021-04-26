# AdEditor

This is a Bachelor's degree project developed with Angular.

The purpose of this project is to automate advertisement banner creation.

Dockerfile included to run with docker. 
Don't forget to run with container port forwarding.

## Important note
This application uses a Google Font API key, which is not set by default.
If you would like to run development server or make production app, you need to
add files `environment.ts` or `environment.prod.ts` into `src/environments` folder.
Example `env` file is already present there. All you need to do is now use your own
Google API key.

## Installation

When running directly on a computer, there are several requirements:
* Node.js (version 14 and higher),
* NPM (version 7 and higher),
* Angular CLI (version ^11.0.0).


If running with docker, the only needed thing is to build an image and run
the container with port forwarding as Dockerfile is included.


### Development notes

This web application uses [Konva.js](https://konvajs.org/) library to manipulate images
and shapes on HTML canvas.

Most of the application logic is in `src/app` folder.

Code is structured into `CoreModule` and `SharedModule`.
`CoreModule` includes services and other module import necessary to use this application.

`SharedModule` includes shared components, transformation pipes and module imports,
which multiple other modules could import.

As this is a SPA, main logic and components are in `EditorModule`.
