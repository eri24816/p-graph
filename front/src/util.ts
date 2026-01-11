export const post = async (url: string, data?: any) => {
    let response: Response
    if (data === undefined) {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
    response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    if (!response.ok) {
        throw new Error(`HTTP error! url: ${url}, status: ${response.status}, message: ${response.statusText}`)
    }
    return response.json()
}

export const get = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error! url: ${url}, status: ${response.status}, message: ${response.statusText}`)
    }
    return response.json()
}