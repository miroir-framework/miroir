# The Library Tutorial

The goal of this tutorial is to explore the concepts and features of the Miroir Framework through the example of the Library application.

Through this tutorial, you will get a glimpse of:

- what is a Miroir Application, how it is stuctured, what it is made of.
- How to display data through an application in Miroir.
- How to modify / manipulate data through an application in Miroir.
- How to adapt the display and implement behavior answering to a use case in Miroir.

We shall assume that you already have a working instance of the Miroir Framework, follow the documentation [here TBW](//https://github.com/miroir-framework/miroir)

## Deploy the Library Application

TBW

## Populate your Library Application Deployment with the example dataset

TBW

## The Home Page

![The Library Application Homepage](./library_homepage.png)

On the left stands the catalogue menu, the application bar is on top, and the Report display below.

## The Catalogue Menu And The Library Entities

![The Library Catalogue Menu](./library_homepage_menu.jpg)

The catalogue menu enables browsing through the data present in the library. Data in the library is classified through `Entities`. An entity is a modeling concept, that regroups instances having a common shape or structure. The set of entities of an application is informally called its `Model` or `data Model`.

The entities in the library Application are:

- Books available in the library's collection
- Authors of Books, comprising their full name, and optional nationality, birthdate and deathdate.
- Publishers of Books,
- Users of the library,
- Countries, an ancilary concept used as reference in Authors and Publishers.

One shall for example speak of the `Book` or the `Author` entity respectively, to reprensent either the structure of all the `Book` instances, or the set of all those instances.

## Example Entity: the User

The list of Users is accessible through the catalogue menu item.

![The Users](./library_users.png)

### User Details

### Update a User

### Create a new User

### The User Entity

### The User List Report

### The User Details Report

## Endpoint and Actions

## Queries

## Runners