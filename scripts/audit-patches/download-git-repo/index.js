module.exports = function downloadGitRepo(_repository, _destination, callback) {
  const error = new Error(
    'download-git-repo is disabled in this project because its git-clone dependency is vulnerable. Use an explicit git clone command when scaffolding templates.',
  );

  if (typeof callback === 'function') {
    callback(error);
    return;
  }

  throw error;
};
