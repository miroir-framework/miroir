pipeline {
    agent {
        docker {
            image 'miroir-ci-node:1.0' 
            args '-p 3000:3000 --add-host host.docker.internal:host-gateway'
        }
    }
    stages {
        stage('Download libs') { 
            steps {
              sh 'env | sort'
              sh 'pwd'
              sh 'whoami'
              sh 'rm -rf /home/tmp/*'
              sh 'ls -ail /home/tmp'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-core/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-redux/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-store-filesystem/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-store-indexedDb/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-store-postgres/node_modules'
              sh 'rm -rf /var/jenkins_home/workspace/miroir-standalone-app-ci/packages/miroir-standalone-app/node_modules'
              sh 'cp -r /var/jenkins_home/workspace/miroir-standalone-app-ci /home/tmp'
              sh 'ls /home/tmp'
              sh 'ls -ail /home/tmp/miroir-standalone-app-ci/'
              sh 'npm config ls -l'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm install'
              // sh 'npm link -w miroir-core'
              // sh 'npm link -w miroir-redux'
              // sh 'npm link -w miroir-store-indexedDb'
              // sh 'npm link -w miroir-store-postgres'
            }
        }
        stage('Build') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && chmod 777 ./link_packages.sh'
              sh 'cd /home/tmp/miroir-standalone-app-ci && ./link_packages.sh'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-core'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-redux'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-filesystem'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-indexedDb'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-store-postgres'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run build -w miroir-standalone-app'
            }
        }
        stage('tests-DomainController-indexedDb') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb-sql.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb-sql.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb-sql.json -- DomainController.Model.undo-redo'
            }
        }
        stage('tests-DomainController-filesystem') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem-sql.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem-sql.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem-sql.json -- DomainController.Model.undo-redo'
            }
        }
        stage('test-DomainController-sql') { 
            steps {
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Data.CRUD'
              sh 'cd /home/tmp/miroir-standalone-app-ci && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.undo-redo'
            }
        }
    }
}