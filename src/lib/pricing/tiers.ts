export type TierId = 'guest' | 'free' | 'pro'

export interface Tier {
    id: TierId
    highlighted: boolean
    comingSoon: boolean
    featureKeys: string[]
}

export const TIERS: Tier[] = [
    {
        id: 'guest',
        highlighted: false,
        comingSoon: false,
        featureKeys: ['editor', 'latex', 'shapes3d', 'shapes2d', 'text', 'tools', 'export', 'languages'],
    },
    {
        id: 'free',
        highlighted: true,
        comingSoon: false,
        featureKeys: ['editor', 'latex', 'shapes3d', 'shapes2d', 'text', 'tools', 'export', 'languages', 'sourceSave'],
    },
    {
        id: 'pro',
        highlighted: false,
        comingSoon: true,
        featureKeys: ['editor', 'latex', 'shapes3d', 'shapes2d', 'text', 'tools', 'export', 'languages', 'sourceSave', 'ai', 'cloud', 'share'],
    },
]