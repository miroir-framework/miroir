# Miroir: The Library Tutorial

This tutorial introduces the Miroir Framework through a concrete example: a Library application. You'll learn by doing - starting with basic operations, then discovering how Miroir's architecture makes them possible.

We assume you have a working Miroir Framework instance. If not, follow the setup documentation [here TBW](//https://github.com/miroir-framework/miroir).

## Getting Started

### Deploy the Library Application

TBW

### Load the Example Data

TBW

## Part 1: Discovering the Library Application

### The Home Page

<img src="./library_homepage.png" alt="The Library Application Homepage" width="95%"/>

The interface has three main areas:

- **Left**: The catalogue menu for browsing data
- **Top**: The application bar
- **Center**: The current view (a Report)

### Browsing Data Through Entities

<img src="./library_homepage_menu.jpg" alt="The Library Catalogue Menu" width="60%"/>

The Library organizes its data into **Entities** - collections of related instances with a common structure:

- **Book** - volumes in the library's collection
- **Author** - book creators, with name, nationality, and dates
- **Publisher** - book publishers
- **User** - library members
- **LendingHistoryItem** - records when some Book has been borrowed by some user (incl. out and return dates)
- **Country** - ancillary concept referenced by Authors and Publishers

Each menu item enables the display of instances for one Entity.

### Working with Users

Click "Library Users" in the catalogue menu to see the Users' list Report:

<img src="./library_users.png" alt="The Users" width="90%"/>

#### Viewing User Details

Click on the name a user in the list to see the report displaying its full information, with the form:

<img src="./library_user_details.png" alt="An example User" width="80%"/>

Miroir manipulates data in the [JSON](https://en.wikipedia.org/wiki/JSON) format. The JSON format for the displayed user can be shown using the above-highlighted switch on the top-right corner.

<img src="./library_user_details_JSON.png" alt="An example User in JSON format" width="80%"/>

#### Modifying a User

Modification on data is possible directly in the details Report, in the form or in the JSON display. Validate your changes by clicking on the blue button on top:

<img src="./library_user_details_EDIT.png" alt="Edit an example User" width="80%"/>

A confirmation is displayed, and the value modified persistently.

<img src="./library_user_details_EDIT_SUCCESS.png" alt="Edit an example User - Success" width="80%"/>

#### Creating a New User

Use the "New User" button:

<img src="./library_user_ADD.png" alt="Display new User Form" width="75%"/>

You get a new user creation form, that you can fill out to add a new user. If you copy / paste the following JSON:

```json
{
  "uuid": "6d4882c3-0438-49e2-973a-0d4b82f23aba",
  "parentUuid": "ca794e28-b2dc-45b3-8137-00151557eea8",
  "name": "Albert Einstein",
  "firstName": "Albert",
  "lastName": "Einstein",
  "street": "33 Park Lane",
  "postalCode": "NJ-4287",
  "city": "Princeton",
  "state": "New Jersey",
  "parentName": "User",
  "country": "2eda1207-4dcc-4af9-a3ba-ef75e7f12c11"
}
```

you will get the following screen:

<img src="./library_user_ADD_form_filled.png" alt="Add a new User" width="80%"/>

Upon validation, a success notification is displayed, and the added User can be seen in the Users' list.

<img src="./library_user_ADD_SUCCESS.png" alt="Add a new User Succeeded" width="80%"/>

#### Deleting a User

In the `UserList` report, find the `Delete` icon for the user you just added.

<img src="./library_user_DROP.png" alt="Drop a User" width="85%"/>

Confirm the Drop:

<!-- ![Drop a User: confirm](./library_user_DROP_confirm.png) -->

<img src="./library_user_DROP_confirm.png" width="70%"/>

A success message is displayed, and the user disappears from the Users' list.

### Going Further: How Does it Work?

We have introduced Entity and Report concepts, we now recap and introduce some of the other main concepts in Miroir.

When you clicked on the "Library Users" item in the menu:

1. The app displayed the `UserList` **Report**
2. The Report executed a **Query** to fetch all User instances
3. Miroir rendered the data using the Report's display specification and the `User` **Entity**'s declared attributes

When you updated, created or deleted a User:

1. The form submitted an update, create or delete **Action** 
2. The Action validated data against the User's **Entity** definition
3. Miroir persisted the instance through the configured store for the Application's **Deployment**
4. The UI refreshed automatically

All of this was configured through JSON declarations, not imperative code. We will now see how.

## Part 2: Working with Entities

We will show how to add an `ISBN` optional attribute to the `Book` Entity.

### Going into 'Design' Mode

Click on the pencil icon on the right of the app bar to enable `Design Mode`. The design mode enables altering the application itself, not only the data the application manipulates.

<img src="./miroir-enabling_design_mode.png" alt="Enable Design Mode" width="70%"/>

The 'report editor' is now shown on the top of the current view and the 'model' menu items are now shown on the left.

<img src="./miroir-design_mode.png" alt="In Design Mode" width="95%"/>

click on the `Library Entity Definitions` menu item.

### Editing the Book Entity Definition

In the lifetime of an application, the precise meaning of an identified concept often fluctuates. For example, we oversaw the necessity of knowing the ISBN of each book, extremely useful to communicate with book sellers.

Adding the ISBN will thus alter the definition of the `Book` entity, without altering the `Book` Entity itself.
<!-- Entities are versioned, enabling controlled evolution of the data model. -->
<!-- Example: The User EntityDefinition declares fields like `name`, `email`, `registrationDate`. -->

Click on the `Book` Entity Definition:

<img src="./library-entityDefinitions_select_Book.png" alt="Select Book Entity Definition" width="85%"/>

This displays the definition, in which the attributes of the Entity are shown:

<img src="./library-model-Book_entity_definition.png" alt="The Book Entity Definition" width="85%"/>

Of particular interest is the `mlSchema` attribute, that describes the structure of a `Book`.


<!-- These definitions are stored as JSON, not hardcoded in TypeScript. This is what makes Miroir applications data-driven. -->


## Part 3: Working with Reports

We will demonstrate the creation of a new Report, based on the following use case: suppose we want to find the books that have never been borrowed.

### Working with Queries and Transformers

A **Query** specifies what data to retrieve. Queries combine:

- **Extractors** - fetch raw data from storage
- **Transformers** - shape the data (filter, map, aggregate)
- **Combiners** - merge multiple queries

Queries can execute in-memory (client/server) or in the database (for SQL backends).

**Key insight**: stored Queries can be used in many reports, and run in the client, the server, or the Database (via SQL translation)

The views you've been using are called **Reports** in Miroir. A Report declares:
- What data to fetch (a **Query**)
- How to display it (display sections)


**Key insight**: Reports are declarative. You describe *what* to show, not *how* to fetch or render it. Miroir handles the implementation.

### other report types

Charts and Graphs, Maps, etc.

## Part 4: Working with Endpoints, Actions and Runners


### Actions: Modifying Data

**Actions** perform operations that change state:
- Create/update/delete Entity instances
- Modify the Model itself (add new Entities)

Actions are declared in **Endpoints** and executed by the framework.

### Transformers: Pure Functions

**Transformers** are pure data transformation functions. They can:
- Filter collections
- Map values
- Aggregate data
- Compose into pipelines

The same Transformer can run client-side, server-side, or be converted to SQL - Miroir handles the translation.

## Part 5: Batch Updates

Showing how to use Queries to perform batch updates of data and building tools in your application beyond the simple CRUD operations.

## What's Next?

You've seen how Miroir applications work from the outside and understand the core concepts. To go deeper:

- Examine the Library EntityDefinitions in `library_model/`
- Study the Report definitions
- Explore how Queries and Actions are declared
- Try creating your own Entity

The power of Miroir lies in making applications declarative, introspective, and data-driven. Furthermore, one can edit an application while running it, without re-buiding and re-packaging this application (just like Smalltalk, but for the web).
