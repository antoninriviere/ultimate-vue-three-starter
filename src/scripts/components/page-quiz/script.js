import appPage from 'Mixins/app-page'

import eventHub from 'Application/event-hub'

import Config from 'Config'
import Quiz from 'Config/quiz'

import GameTypeManager from 'Components/game-type-manager'
import GameScoreManager from 'Components/game-score-manager'
import GameTimeManager from 'Components/game-time-manager'
import GameTransitionManager from 'Components/game-transition-manager'

import QuizDom from 'Components/quiz-dom'
import QuizEmoji from 'Components/quiz-emoji'
import QuizVideo from 'Components/quiz-video'
import QuizCustom from 'Components/quiz-custom'

import { getDebugParams } from 'Utils/Url'
import findIndex from 'lodash.findindex'

import { SET_QUIZ, SET_PROGRESS, WEBGL_ADD_GROUP, WEBGL_CLEAR_GROUP, INCREMENT_PROGRESS } from 'MutationTypes'

export default
{
    name: 'page-quiz',

    components:
    {
        QuizDom,
        QuizEmoji,
        QuizVideo,
        QuizCustom,
        GameTypeManager,
        GameScoreManager,
        GameTimeManager,
        GameTransitionManager
    },

    data()
    {
        return {
            id: this.$route.params.id
        }
    },

    computed: {
        quizObject()
        {
            return this.$store.getters.getCurrentQuestion()
        }
    },

    created()
    {
        this.$store.commit(SET_QUIZ, Quiz)
        const debugParams = getDebugParams()
        this.isDebug = Object.keys(debugParams).length > 0
        if(this.isDebug && Config.environment === 'dev')
        {
            const debugXpId = debugParams.debug
            const debugXpIndex = findIndex(Quiz, { id: debugXpId })
            this.$store.commit(SET_PROGRESS, debugXpIndex)
        }
        else
        {
            this.$store.commit(SET_PROGRESS, this.id - 1)
        }
        this.$store.watch(this.$store.getters.getTransitionProgress, this.onTransitionStart)
        this.$store.watch(this.$store.getters.getCurrentProgress, this.onProgressChange)
        this.$store.watch(this.$store.getters.getQuizStatus, this.onQuizStatusChange)
        eventHub.$on('application:route-change', this.onRouteChange)
    },

    mounted()
    {
        this.lastQuizObject = this.quizObject
        if(this.quizObject.type === '3d')
            this.setupWebGLGroup(this.quizObject.id)

        if(this.quizObject.ambientSound)
            this.setupAmbientSound(this.quizObject.ambientSound)

        if(!this.isDebug)
            this.$refs.timeManager.startTime()
    },

    destroyed()
    {
        if(this.ambientSound)
            this.ambientSound.destroy()
    },

    mixins: [appPage],

    methods:
    {
        // Events
        onClickSkip()
        {
            this.$store.dispatch('skipQuestion', this.quizObject.id)
        },

        onRouteChange(id)
        {
            this.clearQuiz()
            const currentId = id - 1
            this.$store.commit(SET_PROGRESS, currentId)
        },

        clearQuiz()
        {
            if(this.ambientSound)
                this.ambientSound.destroy()

            if(this.lastQuizObject.type === '3d' && this.quizObject.type !== '3d')
                this.$store.commit(WEBGL_CLEAR_GROUP)

            if(this.quizObject.type === '3d')
                this.setupWebGLGroup(this.quizObject.id)

            if(this.quizObject.ambientSound)
                this.setupAmbientSound(this.quizObject.ambientSound)

            this.lastQuizObject = this.quizObject
        },

        onTransitionStart()
        {
            this.$refs.typeManager.transitionOut()
            const options = {
                color: this.quizObject.color
            }
            this.$refs.transitionManager.startTransition(options).then(() =>
            {
                console.log('ended')
                // TODO Clear for prod
                if(this.isDebug && Config.environment === 'dev')
                    return
                this.$store.commit(INCREMENT_PROGRESS)
            })
        },

        onProgressChange(progress)
        {
            console.log('progress change')
            this.$router.push(`/quiz/${progress + 1}`)
        },

        onQuizStatusChange(hasFinished)
        {
            if(hasFinished)
            {
                eventHub.$off('application:route-change', this.onRouteChange)
                this.clearQuiz()
                this.$refs.typeManager.transitionOut()
                this.$refs.transitionManager.startTransition().then(() =>
                {
                    console.log('ended')
                    this.$router.push('/score')
                })
            }
        },

        setupAmbientSound(soundId)
        {
            this.ambientSound = this.$root.audioManager.create({
                url: `../static/sounds/${soundId}.mp3`,
                autoplay: true,
                loop: true
            })
        },

        setupWebGLGroup(id)
        {
            this.$store.commit(WEBGL_ADD_GROUP, id)
        }
    }
}
