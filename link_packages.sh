cd "${target_build_dir}/packages/miroir-core/" && npm link
cd "${target_build_dir}/packages/miroir-localcache-redux/"  && npm link
cd "${target_build_dir}/packages/miroir-react/"  && npm link
cd "${target_build_dir}/packages/miroir-store-filesystem/"  && npm link
cd "${target_build_dir}/packages/miroir-store-indexedDb/"  && npm link
cd "${target_build_dir}/packages/miroir-store-postgres/" && npm link
cd "${target_build_dir}/packages/miroir-standalone-app/" && npm link miroir-core
cd "${target_build_dir}/packages/miroir-standalone-app/" && npm link miroir-localcache-redux
cd "${target_build_dir}/packages/miroir-standalone-app/" && npm link miroir-react
cd "${target_build_dir}/packages/miroir-standalone-app/" && npm link miroir-store-indexedDb
cd "${target_build_dir}/packages/miroir-standalone-app/" && npm link miroir-store-postgres
