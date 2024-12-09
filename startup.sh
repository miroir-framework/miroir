cd ~/Mes\ documents/devhome/miroir-app/ && lerna run build --scope='miroir-store-postgres' && npx lerna run test --scope=miroir-standalone-app -- "DomainController.Model.CRUD.React"
cd ~/Mes\ documents/devhome/miroir-app/ && lerna run build --scope='miroir-localcache-redux' && lerna run watch --scope='miroir-localcache-redux'
cd ~/Mes\ documents/devhome/miroir-app/ && lerna run build --scope='miroir-store-postgres' && lerna run dev2 --scope='miroir-server'
cd ~/Mes\ documents/devhome/miroir-app/ && BROWSER=none npx lerna run start-dev

git-bash --cd=~/Mes\ documents/devhome/miroir-app/ --command usr\\bin\\mintty.exe BROWSER=none npx lerna run start-dev
