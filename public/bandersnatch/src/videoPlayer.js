class VideoMediaPlayer {
    constructor({manifestJSON, network}){
        this.network = network;
        this.manifestJSON = manifestJSON;
        this.videoElement = null;
        this.sourceBuffer = null;
        this.selected = {}
        this.videoDuration = 0
    }

    initializeCodec(){
        this.videoElement = document.getElementById('vid');
        const mediaSoruceSupported = !!window.MediaSource
        if (!mediaSoruceSupported){
            alert('Seu browser ou sistema não tem suporte')
            return;
        }
        const codecSuportted = MediaSource.isTypeSupported(this.manifestJSON.codec);
        if (!codecSuportted){
            alert('Codec não suportado')
        }

        const mediaSource = new MediaSource();
        this.videoElement.src = URL.createObjectURL(mediaSource)

        mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource))
    }

    sourceOpenWrapper(mediaSource) {
        return async(_)=> {
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
            const selected = this.selected = this.manifestJSON.intro;
            mediaSource.duration = this.videoDuration;
            await this.fileDownload(selected.url)
        }
    }

    setVideoPlayerDuration(finalURL) {
        const bars = finalURL.split('/')
        const [ name, videoDuration] = bars[bars.length - 1].split('-')
        this.videoDuration += videoDuration
    }
    
    async fileDownload(url){
        const prepareUrl = {
            url,
            fileResolution: 360,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag
        }
        const finalUrl = this.network.parseManifestURL(prepareUrl)
        this.setVideoPlayerDuration(finalUrl)
        const data = await this.network.fetchFile(finalUrl)
        return this.processBufferSegments(data)
    }

    async processBufferSegments(allSegments) {
        const sourceBuffer = this.sourceBuffer
        sourceBuffer.appendBuffer(allSegments)

        return new Promise((resolve, reject) => {
            const updateEnd = (_) => {
                sourceBuffer.removeEventListener("updateend", updateEnd)
                sourceBuffer.timestampOffset = this.videoDuration

                return resolve()
            }

            sourceBuffer.addEventListener("updateend", updateEnd)
            sourceBuffer.addEventListener("error", reject)
        })
    }

}