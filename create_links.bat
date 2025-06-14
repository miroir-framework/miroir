REM This script creates symbolic links for the jzod and jzod-ts packages in the jzod project
del /f /q C:\Users\nono\Documents\devhome\jzod\node_modules\@miroir-framework\jzod
del /f /q C:\Users\nono\Documents\devhome\jzod\node_modules\@miroir-framework\jzod-ts
mklink /J C:\Users\nono\Documents\devhome\jzod\node_modules\@miroir-framework\jzod C:\Users\nono\Documents\devhome\jzod
mklink /J C:\Users\nono\Documents\devhome\jzod\node_modules\@miroir-framework\jzod-ts C:\Users\nono\Documents\devhome\jzod-ts
dir C:\Users\nono\Documents\devhome\jzod\node_modules\@miroir-framework\

REM This script creates symbolic links for the jzod and jzod-ts packages in the jzod-ts project
del /f /q C:\Users\nono\Documents\devhome\jzod-ts\node_modules\@miroir-framework\jzod
del /f /q C:\Users\nono\Documents\devhome\jzod-ts\node_modules\@miroir-framework\jzod-ts
mklink /J C:\Users\nono\Documents\devhome\jzod-ts\node_modules\@miroir-framework\jzod C:\Users\nono\Documents\devhome\jzod
mklink /J C:\Users\nono\Documents\devhome\jzod-ts\node_modules\@miroir-framework\jzod-ts C:\Users\nono\Documents\devhome\jzod-ts
dir C:\Users\nono\Documents\devhome\jzod-ts\node_modules\@miroir-framework\

REM This script creates symbolic links for the jzod and jzod-ts packages in the miroir-app-dev project.
del /f /q C:\Users\nono\Documents\devhome\miroir-app-dev\node_modules\@miroir-framework\jzod
del /f /q C:\Users\nono\Documents\devhome\miroir-app-dev\node_modules\@miroir-framework\jzod-ts
mklink /J C:\Users\nono\Documents\devhome\miroir-app-dev\node_modules\@miroir-framework\jzod C:\Users\nono\Documents\devhome\jzod
mklink /J C:\Users\nono\Documents\devhome\miroir-app-dev\node_modules\@miroir-framework\jzod-ts C:\Users\nono\Documents\devhome\jzod-ts
dir C:\Users\nono\Documents\devhome\miroir-app-dev\node_modules\@miroir-framework\