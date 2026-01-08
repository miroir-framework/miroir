# Present situation

the edition flow is sub-optimal: if one spots a mistake in an application Report, one must find the corresponding Report definition in the list of application Reports, modify the report, then browse back to the Report display to see if the modification corrected the found mistake.

# Desired result

The edition flow is much smoother:

- there is a boolean value in `ViewParams` that tells if the user can enable "edit mode" on any Report. This value can be enabled / disabled from the appBar, clicking on a pencil icon (grey when false, dark red when enabled)
- when a user displays a Report, if the `generalEditMode` in `ViewParams` is true, there is a pencil icon the top-right corner of each section of the report. Clicking on the pencil enables editing this report's section definition, while still seeing the rendered result. The edition of the `extractors`, `combiners` and `runtimeTransformers` is also possible there if a corresponding item is unfolded. This also works if the Report uses templates as extractors and combiners, or a `runStoredQueries`. An item describing the contents of the environment in which the report is executed is also available to be unfolded (containing `reportParameters` or `reportParametersToFetchQueryParametersTransformer` if defined).
- once the modification is done, the "save" icon next to the pencil (or replacing the pencil) can be clicked, which modifies the state of the currently-displayed report for the component.
- there is a "submit" button at the top, enabling to send an action to effectively update the Report on storage (done via sending an Action, like it's done in `ReportSectionEntityInstance` (`onEditValueObjectFormSubmit`)