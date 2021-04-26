const axios = require('axios')
const { Octokit } = require('@octokit/core')

const user = ''
const token = ''
const currentDirectory = ''
const per_page = 100

const octokit = new Octokit({ auth: token })

const execShellCommand = async (cmd, cwd = currentDirectory) => {
  const exec = require('child_process').exec
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
      }
      resolve(stdout ? stdout : stderr)
    })
  })
}

const createRepository = async (name) => {
  await octokit.request('POST /user/repos', {
    name: name,
    private: false
  })
}

// 복구되지 않으므로 주의해서 사용
const deleteRepository = async (name) => {
  const response = await axios.delete(`https://api.github.com/repos/${user}/${name}`, {
    headers: {
      Authorization: `token ${token}`
    }
  })
}

const gitCloneAndMirror = async (urlAndName) => {
  await execShellCommand(`git clone --mirror https://github.com/${user}/${urlAndName.name}.git`)
  await execShellCommand(`git remote set-url --push origin https://github.com/${user}/mirrored_${urlAndName.name}.git`, `${currentDirectory}${urlAndName.name}.git`)
  await execShellCommand(`git push --mirror`, `${currentDirectory}${urlAndName.name}.git`)
}

const callAsync = async () => {
  // repository 불러오기
  const response = await axios.get('https://api.github.com/user/repos', {
    params: {
      per_page: per_page
    },
    headers: {
      Authorization: `token ${token}`
    }
  })

  // 원하는 내용으로 필터링
  const filteredArr = response.data.filter()

  // mirrored repository 생성
  const mirroredRepositories = filteredArr.map(repo => 'mirrored_' + repo.name)
  await Promise.all(mirroredRepositories.map(name => createRepository(name)))

  const originRepositories = filteredArr.reduce((acc, cur) => {
    acc.push({
      url: cur.url,
      name: cur.name
    })
    return acc
  }, [])

  // git mirror and clone
  await Promise.all(originRepositories.map(urlAndName => gitCloneAndMirror(urlAndName)))

  return 'success'
}

callAsync().then(e => console.log(e)).catch(e => console.error(e.message))

