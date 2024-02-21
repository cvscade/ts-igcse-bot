import { getJoke as fetchJoke, type Category as JokeCategory } from 'chucklejs';

export const getJoke = async (categories: JokeCategory[], amount = 1) => {
    const data = await fetchJoke(categories, {
        blacklistFlags: [
            'nsfw',
            'religious',
            'political',
            'racist',
            'sexist',
            'explicit',
        ],
        amount,
    });

    return data.map((joke) =>
        joke.type === 'single' ? joke.joke : `${joke.setup} ${joke.delivery}`,
    );
};
