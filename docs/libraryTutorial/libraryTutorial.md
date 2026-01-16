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

<img src="./library_homepage_menu.jpg" alt="The Library Catalogue Menu" width="30%"/>

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

<img src="./library_user_ADD_SUCCESS.png" alt="Add a new User Succeeded" width="60%"/>

#### Deleting a User

In the `UserList` report, find the `Delete` icon for the user you just added.

<img src="./library_user_DROP.png" alt="Drop a User" width="85%"/>

Confirm the Drop:

<!-- ![Drop a User: confirm](./library_user_DROP_confirm.png) -->

<img src="./library_user_DROP_confirm.png" width="80%"/>

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

Of special interest is the `mlSchema` attribute, that describes the structure of a `Book`:

<img src="./library-model-Book_entity_definition_mlSchema.png" alt="The Book Entity Definition Attributes" width="85%"/>


A `Book` has the following attributes:

- **uuid**: Unique, primary identifier for the book. Every entity instance must have one.
- **parentName**: Name of the parent Entity or type (optional).
- **parentUuid**: Unique identifier of the parent Entity. Every Entity instance must point to its Entity through this attribute.
- **conceptLevel**: Level or type of concept (optional, `model` or `data`, usal objects are implicitly `data`).
- **name**: The name of the book (title).
- **year**: The year associated with the book (year of first publication).
- **author**: Reference to the author of the book.
- **publisher**: Reference to the publisher of the book.

The `name` is a simple `string`, that will be shown as `Book Title` in forms:

<img src="./library-model-Book_entity_definition_mlSchema_name.png" alt="The Book Entity Definition Attribute: 'name'" width="85%"/>

The `author` is a `uuid`, that is a reference to an instance of the `Author` Entity, a relationship commonly called a [Foreign Key](https://en.wikipedia.org/wiki/Foreign_key) in database systems:

<img src="./library-model-Book_entity_definition_mlSchema_author.png" alt="The Book Entity Definition Attribute: 'author'" width="85%"/>

The `foreignKeyParams` attribute in the `tag` informs the Miroir platform of the intended interpretation for the Foreign Key: in this case the given `uuid` shall be found as primary identifier for a `Book` instance. When selecting a book in the UI, the displayed list of books shall be sorted by the `name` attribute.

To add an attribute, click on the blue **+** icon:

<img src="./library-model-Book_entity_definition_mlSchema_ADD_attribute.png" alt="Adding an Attribute to the Book Entity" width="85%"/>

Edit the attribute's definition to declare it a simple, **optional** string. **remember to declare it optional, because the existing Books do not have a value for it yet, and the structure check for them would otherwise fail!**

<img src="./library-model-Book_entity_definition_mlSchema_ADD_attribute_ISBN.png" alt="Adding ISBN to the Book Entity" width="80%"/>

Validate when ready!

<img src="./library-model-Book_entity_definition_mlSchema_VALIDATE.png" alt="Validate the Book Entity update!" width="50%"/>

Now when displaying the Book details Report for a given book, an optional `ISBN` attribute can be added:

<img src="./library-data-book_add_ISBN.png" alt="Add an ISBN value to a Book" width="50%"/>

Try a value like `123456789` and you're done with Part 2! Congrats!

## Part 3: Working with Reports

<!-- We will demonstrate the creation of a new Report, based on the following use case: suppose we want to find the books that have never been borrowed. -->
We will demonstrate the creation of a new Report that will show the list of books that do not have an ISBN in our database yet.

In order to create this general-purpose Report, we are first going to create a Query, that can be used in the Report and later in other circumstances to help implementing new functions.

Reports are declarative. You describe **what** to show, not **how** to fetch or render it. Miroir handles the implementation. In turn, Queries are also declarative, they describe **which** data elements must be fetched, not **how** to fetch them.

### Working with Queries

A **Query** specifies what data to retrieve. Queries execute, in the following order:

- **Extractors** - fetch raw data from storage
- **Combiners** - join multiple extractors together
- **Transformers** - further shape the data (filter, map, aggregate)

Stored Queries are instances of the **Query** Entity, and have an **uuid** like any other Entity instance.

The existing Queries for the Library Application can be displayed by using the menu when the **Design Mode** is active (using the pencil icon in the app bar).

<img src="./library-model-Query_list.png" alt="The List of Library Queries" width="70%"/>

### Adding the *Book_Lacking_ISBN* Query

Add a new query by using the **"+"** icon on the Queries List. Fill it out with the following definition:

```json
{
  "uuid": "df972710-31ac-4dbe-a114-c0f4cc67e335",
  "parentName": "Query",
  "parentUuid": "e4320b9e-ab45-4abe-85d8-359604b3c62f",
  "name": "Book_Lacking_ISBN",
  "definition": {
    "extractorTemplates": {
      "books": {
        "extractorTemplateType": "extractorTemplateForObjectListByEntity",
        "applicationSection": "data",
        "parentName": "Book",
        "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        "orderBy": {
          "attributeName": "name",
          "direction": "ASC"
        },
        "filter": {
          "attributeName": "ISBN",
          "value": {
            "transformerType": "returnValue",
            "value": "123456789"
          }
        }
      }
    }
  }
}
```

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
