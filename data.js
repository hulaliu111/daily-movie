// 阶段1：示例假数据，阶段2 会被真实采集的榜单数据替换
const MOVIES = [
  {
    id: "tt0111161",
    title: "肖申克的救赎",
    title_en: "The Shawshank Redemption",
    year: 1994,
    directors: ["弗兰克·德拉邦特"],
    actors: ["蒂姆·罗宾斯", "摩根·弗里曼"],
    genres: ["剧情", "犯罪"],
    douban_rating: 9.7,
    douban_votes: "约 290 万人评价",
    rt_tomatometer: 89,
    rt_audience: 98,
    reason: "关于「希望」最好的一部电影。安迪用二十年凿穿一堵墙，其实凿穿的是每个人心里那堵对生活认命的墙。"
  },
  {
    id: "tt0106332",
    title: "霸王别姬",
    title_en: "Farewell My Concubine",
    year: 1993,
    directors: ["陈凯歌"],
    actors: ["张国荣", "张丰毅", "巩俐"],
    genres: ["剧情", "爱情"],
    douban_rating: 9.6,
    douban_votes: "约 200 万人评价",
    rt_tomatometer: 85,
    rt_audience: 93,
    reason: "一辈子只演一个角色的人，最后把自己活成了戏。华语电影里再没有第二部，把「时代」和「人」绑得这样紧。"
  },
  {
    id: "tt0110413",
    title: "这个杀手不太冷",
    title_en: "Léon: The Professional",
    year: 1994,
    directors: ["吕克·贝松"],
    actors: ["让·雷诺", "娜塔莉·波特曼"],
    genres: ["剧情", "动作"],
    douban_rating: 9.4,
    douban_votes: "约 190 万人评价",
    rt_tomatometer: 75,
    rt_audience: 95,
    reason: "冷酷杀手和小女孩之间，长出了这世上最干净的依赖。让·雷诺的孤独，遇上波特曼的早熟，是一对绝配。"
  },
  {
    id: "tt0245429",
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Spirited_Away_Japanese_poster.png/500px-Spirited_Away_Japanese_poster.png",
    title: "千与千寻",
    title_en: "Spirited Away",
    year: 2001,
    directors: ["宫崎骏"],
    actors: ["柊瑠美", "入野自由"],
    genres: ["动画", "奇幻"],
    douban_rating: 9.4,
    douban_votes: "约 170 万人评价",
    rt_tomatometer: 96,
    rt_audience: 96,
    reason: "长大，就是被迫走进一个陌生的世界，然后学会不回头。每个成年人都能在这部动画里，找回自己不小心弄丢的名字。"
  },
  {
    id: "tt0816692",
    title: "星际穿越",
    title_en: "Interstellar",
    year: 2014,
    directors: ["克里斯托弗·诺兰"],
    actors: ["马修·麦康纳", "安妮·海瑟薇"],
    genres: ["科幻", "冒险"],
    douban_rating: 9.4,
    douban_votes: "约 160 万人评价",
    rt_tomatometer: 73,
    rt_audience: 86,
    reason: "当「爱」成为唯一能穿越维度的物理量，科幻就不再只是科学。诺兰把一对父女的牵挂，拍成了宇宙尺度。"
  }
];
