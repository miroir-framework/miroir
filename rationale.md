# The problem

## The Software Development Quandary

Today's Integrated Development Environments (IDEs) used for software development, VS Code for example, are not-so-much "integrated": they directly address only a fraction of development-related activities (writing code, browsing code, somewhat refactoring code) and provide for other needs either:

- a limited support, for activities like version control or testing, through integration of third-party tools (Git, shell terminals, etc.),
-  no support at all, for activities like software design, database / storage design and evolution, or continuous integration.

Any software development project participants thus encounter the forever repeated dilemma of tool selection, use and integration, to address the various needs they are faced with.

Each of the tools they come to use generally features at least one very distinct [Domain Specific Language](https://en.wikipedia.org/wiki/Domain-specific_language), and there is very little inter-operability among these languages, even sometimes among ones featured by the same tool.

As benefit of staying blindsighted to such needs, mainstream IDEs can certainly boast about being independent from any [software Design Method](https://en.wikipedia.org/wiki/Software_development_process) in general, which in a way certainly fosters their wide acceptance (being un-opinionated leads to better acceptance).

However, using different tools and methods at conception / development time and at run-time makes overviewing the whole lifecycle of a software system considerably more difficult. We argue that software development is then paradoxically considered separate from the functions and run-time workings of the system itself, barring any holistic approach from a [Systems Engineering](https://en.wikipedia.org/wiki/Systems_engineering) point-of-view. We view this as a major hindrance to the improvement of software development activities themselves.

This tendency has however been somewhat squelched in recent years, thanks to the development of Continuous Integration / Continuous Delivery ([CI/CD](https://en.wikipedia.org/wiki/CI/CD)) methodologies. We assess that this tendency can be brought much further, with much benefits to be reaped in the transformation.

Only the tools we use still lag in features to address those practices.

# Proposal

Looking in the past for inspiration, some development environments have indeed pioneered this radically different and interactive approach to software development, integrating software development activities and software execution: [Smalltalk](https://en.wikipedia.org/wiki/Smalltalk) being the prime example for this. In Smalltalk, development-time activities and run-time activities are done in the same environment: on the small scale, development, testing and deployment become essentially the same activity. Having perfect, run-time-precise, immediate feedback during development amounts to many developpers to being in a proverbial "ideal world", a paradise lost which many have endeavoured to reach again. Indeed, accelerating feedback is now largely viewed as a primary means to increase software quality and developer productivity (see [Accelerate](https://en.wikipedia.org/wiki/Accelerate_(book))).

Limitations to Smalltalk were yet important, as many issues were outside of the scope that any development environment could reach at the time: no support for version control or any delivery process, no direct support for automated testing, no support for refactoring, no support for software or database model design, etc.

Then comes [online IDEs](https://en.wikipedia.org/wiki/Online_integrated_development_environment) on the scene. Starting from the late 2000's-mid 2010's, tools like [Stackblitz](https://stackblitz.com/), have offered the "usual" functionalities of well-known IDEs but running within the web browser, accessed through the cloud. One then develops a web application, from within another web application (the online IDE), without any synergy between the two.

As a parenthesis, this appears to us that they received, and still receive, a welcoming similar to the one the automobile received immediately after its inception: automobiles were seen, not without reasons, as horse-carriages with motors instead of horses. Yet, in the end automobiles enabled so much more than what could have been dreamt of by the mere impovement of horse carriages.

The Miroir Framework aims at exploiting the synergies between web applications and their development environments: by first and foremost integrating the development and run-time environments, or at least providing access to a perfect mirror image of the run-time environment during the development phase, thus speeding the software quality improvement process, Miroir should enable to concentrate on the essential hardships of software development (adequacy to used needs, and software design).

Miroir shall provide support for:

- model / database design and evolution,
- application of "relevant" software development processes and notations,
- interactive "positive" feedback loops,
- version control, continuous integration and continuous delivery (or even continuous deployment),

# Method & Means

Allow to seamlessly create, integrate and benefit from DSLs at run-time. Enrich an application step-by-step, capturing new world models in DSLs, and connecting those DSLs as deemed fit.

Model-based Software Engineering,

Now web-applications more and more look like any general-purpose application [React Native](https://reactnative.dev/), [Electron](https://www.electronjs.org/).

In the worst case Miroir could end up as yet another software demonstator of somwhat ludicrous, way above their head ideas, or maybe in the best case as another Smalltalk.

Miroir being largely developped in Miroir itself.

# Ways to look at Miroir

There are always many sides to a story...

## For software developers

- DSLs and the "command" pattern gone mad.

Miroir aims at letting applicative software developers concentrate their efforts on tackling the intrinsic complexity of the problem at hand, by providing "standard" solutions for extrinsic complexity of development (storage, concurrent versioning, transactions and data consistency...). Miroir provides the following services:

- a concept modeling DSL for versioned Entities, relations among Entities, applications, users...
- concurrent versioning and transactions for the above-defined concepts,
- transparent access to Databases (Relational, NoSQL) and files,

## For your next-door neighboor

## Model-Based Software Engineering (MBSoE)

Software engineers usually rely on models at least in the conception phase of applications, using variants on well-known methods (merise, Booch, etc.) and notations (UML), which are part of the state-of-the art informal lingua-franca, that can be observed along blog articles, software documentation, or software problem-solving forums all around the internet.

Such models remain used, in our experience and observations, mostly as support for development-time communication among developers themselves, and at most as a basis for user-documentation.

We propose to use software models all along the software development lifecycle. We claim that the tools to create, manipulate and exploit these models are now for the most part readily available, and that there has been an incomprehensible delay in the software industry to take this fact into account.

From abstract, simple models, we claim to:

- infer display properties, used in generating graphical user interfaces,
- infer storage properties, for any available storage form (NoSQL database or key-value files, JSON files, Relational database, distributed databases, plain-text databases),
- provide the end-user with the capacity to analyze and extract the wanted information from the modeled data,
- provide the end-user with the capacity to define and exploit Domain-Specific Languages (DSLs) at any level of the software to implement business functionalities,
- allow value-adding business code to be reused among server and client.

## Comparison to existing solutions

Some existing platform limitate the scope, horizontally or vertically:

- Tooljet and others are focused on Graphical User Intreface aspects, the built "model" is not used for other purposes,
- Cliq Sense: allows modeling somewhat, focused on time series
- RStudio: not intended to build "releasable" apps?

## Developing Web Applications, the Miroir way

### What you give

-  a structured model of the data you manipulate, which you have to maintain through an integrated versioning tool
-  a definition for one or more Domain-Specific-Languages (DSL), encompassing actions for data edition and data transformation
-  a set of queries used to retrieve the data relevant for display, written in one of the Miroir Query Languages (MQL)



### What you get

- a back-end web server (nodejs) able to execute your DSL Actions and return the required data 
- a web application, that can be executed through a "plain" desktop-based application, or be deployed within the server and accessed through the browser
