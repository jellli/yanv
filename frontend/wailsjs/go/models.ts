export namespace main {
	
	export class NovelQuery {
	    title?: string;
	    author?: string;
	    category?: string;
	    update_time?: string;
	    star_rating?: number;
	
	    static createFrom(source: any = {}) {
	        return new NovelQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.author = source["author"];
	        this.category = source["category"];
	        this.update_time = source["update_time"];
	        this.star_rating = source["star_rating"];
	    }
	}

}

export namespace models {
	
	export class Novel {
	    id: string;
	    title: string;
	    author: string;
	    category: string;
	    star_rating: number;
	    summary: string;
	    short_intro: string;
	    conception: string;
	    tags: string;
	    keywords: string;
	    update_time: string;
	    size: string;
	    source_url: string;
	    download_url: string;
	    local_path: string;
	
	    static createFrom(source: any = {}) {
	        return new Novel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.category = source["category"];
	        this.star_rating = source["star_rating"];
	        this.summary = source["summary"];
	        this.short_intro = source["short_intro"];
	        this.conception = source["conception"];
	        this.tags = source["tags"];
	        this.keywords = source["keywords"];
	        this.update_time = source["update_time"];
	        this.size = source["size"];
	        this.source_url = source["source_url"];
	        this.download_url = source["download_url"];
	        this.local_path = source["local_path"];
	    }
	}

}

