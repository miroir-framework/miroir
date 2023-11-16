#!groovy
pipeline {
  environment {
    src_dir = "/var/jenkins_home/workspace/miroir-standalone-app-ci"
    build_dir = "/home/workspace/tmp"
    target_build_dir = "/home/workspace/tmp/miroir-standalone-app-ci"
    target_build_backup_dir = "/home/workspace/tmp/miroir-standalone-app-ci_backup"
  }
  agent {
    dockerfile {
      filename 'Dockerfile'
      dir '/home/workspace/miroir-app-ci/node_image'
      args '-v build_space:/home/workspace/tmp'
    }
  }
  stages {
      stage('Download libs') { 
        steps {
          script {
            sh 'env | sort'
            sh 'pwd'
            sh 'whoami'
            sh 'ls -ail /home'
            sh 'ls -ail /home/workspace'
            sh 'ls -ail /home/node_modules'
            sh 'ls -ail /home/tmp'
            sh 'ls -ail /var/jenkins_home/workspace'
            // for filesystem tests ***
            sh 'if [ -d "${build_dir}/miroir_model" ] ; then rm -rf "${build_dir}/miroir_model/*" ; else mkdir -p "${build_dir}/miroir_model" && chmod 777 "${build_dir}/miroir_model" ; fi'
            sh 'if [ -d "${build_dir}/miroir_data" ] ; then rm -rf "${build_dir}/miroir_data/*" ; else mkdir -p "${build_dir}/miroir_data" && chmod 777 "${build_dir}/miroir_data" ; fi'
            sh 'if [ -d "${build_dir}/library_model" ] ; then rm -rf "${build_dir}/library_model/*" ; else mkdir -p "${build_dir}/library_model" && chmod 777 "${build_dir}/library_model" ; fi'
            sh 'if [ -d "${build_dir}/library_data" ] ; then rm -rf "${build_dir}/library_data/*" ; else mkdir -p "${build_dir}/library_data" && chmod 777 "${build_dir}/library_data" ; fi'
            // ***
            sh 'if [ -d "${target_build_backup_dir}" ] ; then rm -rf "${target_build_backup_dir}" ; fi'
            sh 'if [ -d "${target_build_dir}" ] ; then mv "${target_build_dir}" "${target_build_backup_dir}" ; fi'
            sh 'cp -r "${src_dir}" "${build_dir}"'
            sh 'if [ -d "${target_build_backup_dir}/node_modules" ] ; then mv ${target_build_backup_dir}/node_modules ${target_build_dir} ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-core/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-core/node_modules ${target_build_dir}/miroir-core ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-localcache-redux/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-localcache-redux/node_modules ${target_build_dir}/miroir-localcache-redux ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-server-msw-stub/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-server-msw-stub/node_modules ${target_build_dir}/miroir-server-msw-stub ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-store-filesystem/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-store-filesystem/node_modules ${target_build_dir}/miroir-store-filesystem ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-store-indexedDb/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-store-indexedDb/node_modules ${target_build_dir}/miroir-store-indexedDb ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-store-postgres/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-store-postgres/node_modules ${target_build_dir}/miroir-store-postgres ; fi'
            sh 'if [ -d "${target_build_backup_dir}/miroir-standalone-app/node_modules" ] ; then mv ${target_build_backup_dir}/miroir-standalone-app/node_modules ${target_build_dir}/miroir-standalone-app ; fi'
            sh 'ls -ail ${build_dir}'
            sh 'ls -ail ${target_build_dir}'
            sh 'npm config ls -l'
            sh 'cd "${target_build_dir}" && npm install'
          }
        }
      }
      stage('Build') { 
        steps {
          sh 'cd "${target_build_dir}" && chmod 777 ./link_packages.sh'
          sh 'cd "${target_build_dir}" && ./link_packages.sh'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-core'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-localcache-redux'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-server-msw-stub'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-store-filesystem'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-store-indexedDb'
          // sh 'cd "${target_build_dir}" && npm run build -w miroir-store-postgres'
          sh 'cd "${target_build_dir}" && npm run build -w miroir-standalone-app'
        }
      }
      stage('tests-DomainController-indexedDb') { 
          steps {
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Model.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Data.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-indexedDb.json -- DomainController.Model.undo-redo'
          }
      }
      stage('test-DomainController-sql') { 
          steps {
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Data.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-dockerized-sql.json -- DomainController.Model.undo-redo'
          }
      }
      stage('tests-DomainController-filesystem') { 
          steps {
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Model.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Data.CRUD'
            sh 'cd "${target_build_dir}" && npm run test -w miroir-standalone-app --env=./tests/miroirConfig.test-ci-emulatedServer-filesystem.json -- DomainController.Model.undo-redo'
          }
      }
  }
}