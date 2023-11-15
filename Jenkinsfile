pipeline {
    agent {
      dockerfile {
        filename 'Dockerfile'
        dir '/home/workspace/miroir-app-ci/node_image'
      }
    }
    stages {
        stage('Download libs') { 
          steps {
            sh 'env | sort'
            sh 'pwd'
            sh 'whoami'
            sh 'mv /home/tmp/miroir-standalone-app-ci /home/tmp/miroir-standalone-app-ci_backup'
            sh 'ls -ail /home'
            sh 'ls -ail /home/tmp'
            sh 'ls -ail /home/tmp/miroir-standalone-app-ci_backup'
            // sh 'rm -rf /home/tmp/*'
            sh 'cp -r /var/jenkins_home/workspace/miroir-standalone-app-ci /home/tmp'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/node_modules /home/tmp/miroir-standalone-app-ci'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-core/node_modules /home/tmp/miroir-standalone-app-ci/miroir-core'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-localcache-redux/node_modules /home/tmp/miroir-standalone-app-ci/miroir-localcache-redux'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-server-msw-stub/node_modules /home/tmp/miroir-standalone-app-ci/miroir-server-msw-stub'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-store-filesystem/node_modules /home/tmp/miroir-standalone-app-ci/miroir-store-filesystem'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-store-indexedDb/node_modules /home/tmp/miroir-standalone-app-ci/miroir-store-indexedDb'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-store-postgres/node_modules /home/tmp/miroir-standalone-app-ci/miroir-store-postgres'
            sh 'mv /home/tmp/miroir-standalone-app-ci_backup/miroir-standalone-app/node_modules /home/tmp/miroir-standalone-app-ci/miroir-standalone-app'
            sh 'ls -ail /home/tmp'
            sh 'ls -ail /home/tmp/miroir-standalone-app-ci/'
            sh 'npm config ls -l'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm install'
          }
        }
        stage('Build') { 
          steps {
            sh 'cd /home/tmp/miroir-standalone-app-ci && chmod 777 ./link_packages.sh'
            sh 'cd /home/tmp/miroir-standalone-app-ci && ./link_packages.sh'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-core'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-localcache-redux'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-server-msw-stub'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-filesystem'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-indexedDb'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-postgres'
            sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-standalone-app'
          }
        }
        stage('tests-DomainController-indexedDb') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Model.undo-redo'
            }
        }
        stage('test-DomainController-sql') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.undo-redo'
            }
        }
        stage('tests-DomainController-filesystem') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Model.undo-redo'
            }
        }
    }
}